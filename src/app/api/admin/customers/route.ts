import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getRedisClient } from '@/lib/redis';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import type { Pool } from 'pg';

export async function GET(request: NextRequest) {
  try {
    // Admin-Auth mit Rate Limiting
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Rate limit oder Auth-Fehler
    }
    const { user } = authResult;

    const customerId = request.nextUrl.searchParams.get('id');
    if (customerId) {
      try {
        const detail = await getCustomerDetails(customerId);
        if (!detail || !detail.customer) {
          return secureResponse({ error: 'Kunde nicht gefunden' }, 404);
        }
        return secureResponse(detail);
      } catch (error) {
        console.error('Fehler beim Laden der Kundendetails:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('Fehler-Details:', { errorMessage, errorStack, customerId });
        return secureResponse({ 
          error: 'Fehler beim Laden der Kundendaten',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }, 500);
      }
    }

    const redis = getRedisClient();
    const cacheKey = 'admin:customers:list';
    try {
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) return NextResponse.json(JSON.parse(cached));
      }
    } catch {
      // Redis nicht verfügbar - ignorieren
    }

    let client;
    let tempPool: import('pg').Pool | null = null;
    try {
      client = await pool.connect();
    } catch (connectionError) {
      // Bei SSL-Fehler oder Hostname-Fehler: Erstelle temporären Pool mit expliziter SSL-Konfiguration
      const errorMsg = connectionError instanceof Error ? connectionError.message : '';
      const isSSLError = errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify');
      const isHostnameError = errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo');
      
      // Hostname-Fehler: Versuche automatisch mit DATABASE_PUBLICURL (für Mac)
      if (isHostnameError) {
        console.warn('⚠️ Kundenliste - Interne URL kann nicht aufgelöst werden, versuche DATABASE_PUBLICURL...');
        const publicUrl = process.env.DATABASE_PUBLICURL;
        if (publicUrl) {
          try {
            const { Pool: TempPool } = await import('pg');
            tempPool = new TempPool({
              connectionString: publicUrl,
              ssl: publicUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
              connectionTimeoutMillis: 10000,
            });
            client = await tempPool.connect();
            console.log('✅ Kundenliste - Verbindung mit DATABASE_PUBLICURL erfolgreich');
          } catch (publicUrlError) {
            const publicErrorMsg = publicUrlError instanceof Error ? publicUrlError.message : '';
            console.error('❌ Kundenliste - Auch DATABASE_PUBLICURL fehlgeschlagen:', publicErrorMsg);
            if (tempPool) await tempPool.end();
            throw new Error(`Datenbank-Verbindung fehlgeschlagen: ${errorMsg}. Auch DATABASE_PUBLICURL fehlgeschlagen: ${publicErrorMsg}`);
          }
        } else {
          throw new Error(`Datenbank-Hostname kann nicht aufgelöst werden und DATABASE_PUBLICURL ist nicht gesetzt: ${errorMsg}`);
        }
      }
      // SSL-Fehler: Versuche Fallback mit DATABASE_URL (für VPS)
      else if (isSSLError) {
        console.warn('⚠️ Kundenliste - SSL-Fehler, versuche Fallback...');
        const { Pool: TempPool } = await import('pg');
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
          throw new Error('DATABASE_URL ist nicht gesetzt');
        }
        tempPool = new TempPool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        });
        try {
          client = await tempPool.connect();
          console.log('✅ Kundenliste - SSL-Fallback erfolgreich');
        } catch (sslFallbackError) {
          if (tempPool) await tempPool.end();
          throw sslFallbackError;
        }
      } else {
        throw connectionError;
      }
    }
    
    // Führe Abfragen aus (egal ob normale Verbindung oder Fallback)
    try {
      const query = `
        SELECT 
          c.id,
          c.email,
          c.name,
          c.phone,
          c.company_name,
          c.customer_number,
          c.portal_activated,
          c.created_at,
          COUNT(DISTINCT b.id) as booking_count,
          COALESCE(SUM(b.total_amount_cents), 0) as total_revenue_cents,
          MAX(b.created_at) as last_booking_date
        FROM customers c
        LEFT JOIN webwelle_bookings b ON (b.customer_id = c.id OR b.customer_email = c.email)
        GROUP BY c.id, c.email, c.name, c.phone, c.company_name, c.customer_number, c.portal_activated, c.created_at
        ORDER BY c.created_at DESC
      `;
      const result = await client.query(query);

      const customers = result.rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        phone: row.phone,
        companyName: row.company_name,
        customerNumber: row.customer_number,
        portalActivated: row.portal_activated,
        createdAt: row.created_at,
        stats: {
          bookingCount: parseInt(row.booking_count) || 0,
          totalRevenue: parseInt(row.total_revenue_cents) || 0,
          lastBookingDate: row.last_booking_date,
        }
      }));

      // Cache setzen (falls Redis verfügbar)
      try {
        if (redis) {
          await redis.setex(cacheKey, 300, JSON.stringify(customers));
        }
      } catch {
        // Redis-Fehler ignorieren
      }

      return secureResponse(customers);
    } catch (queryError) {
      console.error('❌ Fehler bei Kundenliste-Query:', queryError);
      throw queryError;
    } finally {
      if (client) client.release();
      if (tempPool) await tempPool.end();
    }
  } catch (error) {
    console.error('Fehler beim Laden der Kunden:', error);
    return secureResponse({ 
      error: 'Fehler beim Laden der Kunden'
    }, 500);
  }
}

async function getCustomerDetails(customerId: string) {
  console.log('🔍 getCustomerDetails aufgerufen für:', customerId);
  let client: import('pg').PoolClient | undefined;
  let tempPool: import('pg').Pool | null = null;
  
  try {
    client = await pool.connect();
    console.log('✅ Datenbankverbindung erfolgreich');
  } catch (connectionError) {
    console.error('❌ Datenbankverbindung fehlgeschlagen:', connectionError);
    const errorMsg = connectionError instanceof Error ? connectionError.message : '';
    const isSSLError = errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify');
    const isHostnameError = errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo');
    
    // Hostname-Fehler: Versuche automatisch mit DATABASE_PUBLICURL (für Mac)
    if (isHostnameError) {
      console.warn('⚠️ getCustomerDetails - Interne URL kann nicht aufgelöst werden, versuche DATABASE_PUBLICURL...');
      const publicUrl = process.env.DATABASE_PUBLICURL;
      if (publicUrl) {
        try {
          const { Pool: TempPool } = await import('pg');
          tempPool = new TempPool({
            connectionString: publicUrl,
            ssl: publicUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 10000,
          });
          client = await tempPool.connect();
          console.log('✅ getCustomerDetails - Verbindung mit DATABASE_PUBLICURL erfolgreich');
        } catch (publicUrlError) {
          const publicErrorMsg = publicUrlError instanceof Error ? publicUrlError.message : '';
          console.error('❌ getCustomerDetails - Auch DATABASE_PUBLICURL fehlgeschlagen:', publicErrorMsg);
          if (tempPool) await tempPool.end();
          throw new Error(`Datenbank-Verbindung fehlgeschlagen: ${errorMsg}. Auch DATABASE_PUBLICURL fehlgeschlagen: ${publicErrorMsg}`);
        }
      } else {
        throw new Error(`Datenbank-Hostname kann nicht aufgelöst werden und DATABASE_PUBLICURL ist nicht gesetzt: ${errorMsg}`);
      }
    }
    // SSL-Fehler: Versuche Fallback mit DATABASE_URL (für VPS)
    else if (isSSLError) {
      console.warn('⚠️ getCustomerDetails - SSL-Fehler, versuche Fallback...');
      const { Pool: TempPool } = await import('pg');
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL ist nicht gesetzt');
      }
      tempPool = new TempPool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      try {
        client = await tempPool.connect();
        console.log('✅ getCustomerDetails - SSL-Fallback erfolgreich');
      } catch (sslFallbackError) {
        if (tempPool) await tempPool.end();
        throw sslFallbackError;
      }
    } else {
      // Unbekannter Fehler
      throw connectionError;
    }
  }
  
  // Prüfe ob client definiert ist
  if (!client) {
    throw new Error('Datenbank-Client ist nicht definiert');
  }
  
  // Führe Abfragen aus (egal ob normale Verbindung oder Fallback)
  try {
    // Performance: Nur benötigte Spalten selektieren
    // Prüfe zuerst, ob Adressfelder existieren
    console.log('🔍 Suche Kunde in Datenbank...', tempPool ? '(Fallback)' : '(normal)');
    
    // Prüfe ob Adressfelder existieren
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'customers' 
      AND column_name IN ('street', 'city', 'zip', 'country')
    `);
    const hasAddressFields = columnCheck.rows.length > 0;
    
    // Baue Query dynamisch auf - nur Spalten verwenden, die existieren
    const baseColumns = 'id, email, name, phone, company_name, customer_number, portal_activated, portal_activated_at, is_verified, created_at, updated_at';
    const addressColumns = hasAddressFields ? ', street, city, zip, country' : '';
    const selectColumns = baseColumns + addressColumns;
    
    const customerResult = await client.query(
      `SELECT ${selectColumns} FROM customers WHERE id = $1`,
      [customerId]
    );
    console.log('📊 Kunden-Query Ergebnis:', { rowCount: customerResult.rows.length, customerId });
    if (customerResult.rows.length === 0) {
      console.log('⚠️ Kunde nicht gefunden in Datenbank');
      return null;
    }
    const customer = customerResult.rows[0];
    console.log('✅ Kunde gefunden:', { id: customer.id, email: customer.email });
    
    const bookingsResult = await client.query(
      `SELECT 
        id,
        package_type,
        status,
        total_amount_cents,
        currency,
        created_at,
        customer_name,
        customer_email,
        company_name
       FROM webwelle_bookings 
       WHERE customer_id = $1 OR customer_email = $2 
       ORDER BY created_at DESC`,
      [customerId, customer.email]
    );
    
    const invoicesResult = await client.query(
      `SELECT 
        id,
        invoice_number,
        stripe_invoice_id,
        amount_cents,
        currency,
        status,
        paid_at,
        due_date,
        pdf_url,
        hosted_invoice_url,
        created_at
       FROM invoices 
       WHERE customer_id = $1 OR customer_email = $2 
       ORDER BY created_at DESC`,
      [customerId, customer.email]
    );
    
    return { 
      customer, 
      bookings: bookingsResult.rows || [], 
      invoices: invoicesResult.rows || [],
      subscriptions: [] 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Fehler in getCustomerDetails:', {
      message: errorMessage,
      stack: errorStack,
      customerId,
      hasClient: !!client,
      hasTempPool: !!tempPool
    });
    throw error;
  } finally {
    try {
      if (client) {
        client.release();
      }
    } catch (releaseError) {
      console.error('⚠️ Fehler beim Release des Clients:', releaseError);
    }
    try {
      if (tempPool) {
        await tempPool.end();
      }
    } catch (endError) {
      console.error('⚠️ Fehler beim Beenden des tempPool:', endError);
    }
  }
}


