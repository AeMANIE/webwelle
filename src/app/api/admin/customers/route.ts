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
      const detail = await getCustomerDetails(customerId);
      return NextResponse.json(detail);
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
    try {
      client = await pool.connect();
    } catch (connectionError) {
      // Bei SSL-Fehler oder Hostname-Fehler: Erstelle temporären Pool mit expliziter SSL-Konfiguration
      const errorMsg = connectionError instanceof Error ? connectionError.message : '';
      if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || 
          errorMsg.includes('unable to verify') || errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo')) {
        const { Pool: TempPool } = await import('pg');
        // Versuche mit öffentlicher URL falls DATABASE_PUBLICURL gesetzt ist
        const dbUrl = process.env.DATABASE_PUBLICURL || process.env.DATABASE_URL;
        const tempPool = new TempPool({
          connectionString: dbUrl,
          ssl: dbUrl?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 10000,
        });
        client = await tempPool.connect();
        // Verwende den temporären Pool für diese Anfrage
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
          
          client.release();
          await tempPool.end();
          return secureResponse(customers);
        } catch (queryError) {
          client.release();
          await tempPool.end();
          throw queryError;
        }
      } else {
        throw connectionError;
      }
    }

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
    } finally {
      if (client) client.release();
    }
  } catch (error) {
    console.error('Fehler beim Laden der Kunden:', error);
    return secureResponse({ 
      error: 'Fehler beim Laden der Kunden'
    }, 500);
  }
}

async function getCustomerDetails(customerId: string) {
  let client;
  try {
    client = await pool.connect();
  } catch (connectionError) {
    // Bei SSL-Fehler: Erstelle temporären Pool
    const errorMsg = connectionError instanceof Error ? connectionError.message : '';
    if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify')) {
      const { Pool: TempPool } = await import('pg');
      const tempPool = new TempPool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      client = await tempPool.connect();
      // Führe Abfragen aus und beende dann den temporären Pool
      try {
        // Performance: Nur benötigte Spalten selektieren
        const customerResult = await client.query(
          `SELECT id, email, name, phone, company_name, customer_number, 
                  street, city, zip, country, portal_activated, portal_activated_at, 
                  is_verified, created_at, updated_at 
           FROM customers WHERE id = $1`,
          [customerId]
        );
        if (customerResult.rows.length === 0) {
          client.release();
          await tempPool.end();
          return null;
        }
        const customer = customerResult.rows[0];
        
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
        
        client.release();
        await tempPool.end();
        return { 
          customer, 
          bookings: bookingsResult.rows, 
          invoices: invoicesResult.rows,
          subscriptions: [] 
        };
      } catch (error) {
        if (client) client.release();
        await tempPool.end();
        throw error;
      }
    }
    throw connectionError;
  }
  
  // Normale Abfrage mit dem verbundenen Client
  try {
    // Performance: Nur benötigte Spalten selektieren
    const customerResult = await client.query(
      `SELECT id, email, name, phone, company_name, customer_number, 
              street, city, zip, country, portal_activated, portal_activated_at, 
              is_verified, created_at, updated_at 
       FROM customers WHERE id = $1`,
      [customerId]
    );
    if (customerResult.rows.length === 0) return null;
    const customer = customerResult.rows[0];
    
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
      bookings: bookingsResult.rows, 
      invoices: invoicesResult.rows,
      subscriptions: [] 
    };
  } finally {
    client.release();
  }
}


