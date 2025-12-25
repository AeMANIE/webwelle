import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getRedisClient } from '@/lib/redis';
import { requireAdminAuth, secureResponse, validateAPIInput } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Bookings API - Start');
    
    // Admin-Auth mit Rate Limiting
    console.log('🔍 Bookings API - requireAdminAuth aufrufen...');
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      console.log('❌ Bookings API - Auth fehlgeschlagen');
      return authResult; // Rate limit oder Auth-Fehler
    }
    console.log('✅ Bookings API - Auth erfolgreich:', authResult.user.email);

    // Zeitfilter: Standard ist letzte 3 Monate
    const period = request.nextUrl.searchParams.get('period') || '3months';
    
    // Input-Validierung
    const validation = validateAPIInput(
      { period },
      { period: { type: 'string', required: false } }
    );
    
    if (!validation.isValid) {
      return secureResponse({ error: 'Ungültige Parameter', errors: validation.errors }, 400);
    }
    
    // Datum für Filter berechnen
    let dateFilter: Date | null = null;
    const now = new Date();
    
    switch (period) {
      case '3months':
        dateFilter = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)); // 3 Monate
        break;
      case '6months':
        dateFilter = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000)); // 6 Monate
        break;
      case 'all':
        dateFilter = null; // Alle
        break;
      default:
        dateFilter = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)); // Standard: 3 Monate
    }

    // Cache-Key mit Period
    const redis = getRedisClient();
    const cacheKey = `admin:bookings:list:${period}`;
    
    if (redis && redis.status === 'ready') {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return secureResponse(JSON.parse(cached));
      } catch (cacheError) {
        console.warn('⚠️ Redis Cache-Fehler (ignoriert):', cacheError);
      }
    }

    let client;
    let tempPool: import('pg').Pool | null = null;
    
    try {
      console.log('🔍 Bookings API - Datenbankverbindung herstellen...');
      client = await pool.connect();
      console.log('✅ Bookings API - Datenbankverbindung erfolgreich');
    } catch (connectionError) {
      // Bei SSL-Fehler oder Passwort-Fehler: Erstelle temporären Pool mit expliziter SSL-Konfiguration
      const errorMsg = connectionError instanceof Error ? connectionError.message : '';
      console.log('🔍 Bookings API - Verbindungsfehler:', errorMsg);
      
      // Prüfe auf verschiedene Fehlertypen
      const isSSLError = errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify');
      const isPasswordError = errorMsg.includes('password authentication failed') || errorMsg.includes('authentication failed');
      
      if (isSSLError || isPasswordError) {
        // Verwende die zentrale Funktion aus database.ts
        const { createTempPool } = await import('@/lib/database');
        
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
          console.error('❌ DATABASE_URL nicht gesetzt');
          throw new Error('DATABASE_URL Umgebungsvariable ist nicht gesetzt');
        }
        
        try {
          const { correctDatabaseUrl } = await import('@/lib/database');
          const correctedUrl = correctDatabaseUrl(dbUrl);
          const url = new URL(correctedUrl);
          console.log('🔍 Bookings API - URL korrigiert:', {
            host: url.hostname,
            port: url.port,
            database: url.pathname.replace(/^\//, ''),
            username: url.username,
            hasPassword: !!url.password,
            passwordLength: url.password?.length || 0,
            sslMode: url.searchParams.get('sslmode')
          });
        } catch (urlError) {
          console.error('❌ Bookings API - URL-Parsing fehlgeschlagen:', urlError);
        }
        
        tempPool = await createTempPool({ rejectUnauthorized: false });
        
        try {
          client = await tempPool.connect();
          console.log('✅ Bookings API - SSL-Fallback erfolgreich');
        } catch (fallbackError) {
          console.error('❌ Bookings API - SSL-Fallback fehlgeschlagen:', fallbackError);
          const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : '';
          console.error('❌ Fallback-Fehler-Details:', fallbackErrorMsg);
          
          if (tempPool) await tempPool.end();
          
          // Wenn es ein Passwort-Fehler ist, gib eine hilfreiche Fehlermeldung zurück
          if (fallbackErrorMsg.includes('password authentication failed')) {
            try {
              const { correctDatabaseUrl } = await import('@/lib/database');
              const correctedUrl = correctDatabaseUrl(dbUrl);
              const url = new URL(correctedUrl);
              
              return secureResponse(
                {
                  error: 'Datenbank-Authentifizierung fehlgeschlagen',
                  message: 'Das Passwort in der DATABASE_URL ist falsch oder der Benutzer existiert nicht',
                  solution: 'Bitte überprüfen Sie die DATABASE_URL in Ihrer .env-Datei. Stellen Sie sicher, dass das Passwort korrekt ist und keine Sonderzeichen URL-encoding benötigen.',
                  details: process.env.NODE_ENV !== 'production' ? {
                    host: url.hostname,
                    port: url.port,
                    database: url.pathname.replace(/^\//, ''),
                    username: url.username,
                    sslMode: url.searchParams.get('sslmode')
                  } : undefined
                },
                500
              );
            } catch (urlError) {
              return secureResponse(
                {
                  error: 'Datenbank-Authentifizierung fehlgeschlagen',
                  message: 'Das Passwort in der DATABASE_URL ist falsch oder der Benutzer existiert nicht',
                  solution: 'Bitte überprüfen Sie die DATABASE_URL in Ihrer .env-Datei'
                },
                500
              );
            }
          }
          
          throw connectionError;
        }
      } else {
        console.error('❌ Bookings API - Unbekannter Verbindungsfehler:', errorMsg);
        throw connectionError;
      }
    }

    try {
      // Prüfe zuerst, ob die Tabelle existiert
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'webwelle_bookings'
        );
      `;
      console.log('🔍 Bookings API - Tabelle prüfen...');
      const tableExists = await client.query(tableCheckQuery);
      
      if (!tableExists.rows[0]?.exists) {
        console.error('❌ Tabelle webwelle_bookings existiert nicht');
        return secureResponse(
          { 
            error: 'Tabelle webwelle_bookings existiert nicht',
            message: 'Bitte führen Sie das Datenbank-Setup-Skript aus'
          },
          500
        );
      }
      console.log('✅ Bookings API - Tabelle existiert');

      // Performance: Nur benötigte Spalten selektieren (kein SELECT *)
      let query = `SELECT id, session_id, package_type, is_monthly, checkout_mode, 
                          package_price_display, currency, total_amount_cents, 
                          customer_id, customer_name, customer_email, customer_phone, 
                          company_name, status, created_at, stripe_customer_id, 
                          stripe_payment_intent_id, stripe_subscription_id 
                   FROM webwelle_bookings`;
      const params: unknown[] = [];
      
      if (dateFilter) {
        query += ' WHERE created_at >= $1';
        params.push(dateFilter);
      }
      
      query += ' ORDER BY created_at DESC';
      
      console.log('🔍 Bookings API - Query ausführen...', { query: query.substring(0, 100) + '...', paramsCount: params.length });
      const result = await client.query(query, params);
      const bookingsData = result.rows;
      console.log('✅ Bookings API - Query erfolgreich,', bookingsData.length, 'Zeilen gefunden');

      // Cache speichern (5 Minuten TTL)
      if (redis && redis.status === 'ready') {
        try {
          await redis.setex(cacheKey, 300, JSON.stringify(bookingsData));
        } catch (cacheError) {
          console.warn('⚠️ Redis Cache-Speicher-Fehler (ignoriert):', cacheError);
        }
      }

      // Wenn tempPool verwendet wurde, beende es
      if (tempPool) {
        client.release();
        await tempPool.end();
        console.log('✅ Bookings API - Response senden (tempPool)');
        return secureResponse(bookingsData);
      }

      console.log('✅ Bookings API - Response senden (normal)');
      return secureResponse(bookingsData);
    } catch (queryError) {
      console.error('❌ Bookings API - Query-Fehler:', queryError);
      const queryErrorMessage = queryError instanceof Error ? queryError.message : 'Unbekannter Query-Fehler';
      console.error('❌ Query-Fehler-Details:', queryErrorMessage);
      
      // Cleanup
      if (client) {
        if (tempPool) {
          client.release();
          await tempPool.end();
        } else {
          client.release();
        }
      }
      
      return secureResponse(
        { 
          error: 'Fehler beim Ausführen der Datenbankabfrage',
          message: queryErrorMessage,
          details: process.env.NODE_ENV !== 'production' 
            ? (queryError instanceof Error ? queryError.stack : undefined) 
            : undefined
        },
        500
      );
    } finally {
      if (client && !tempPool) {
        client.release();
      }
    }
  } catch (error) {
    console.error('❌ Fehler beim Laden der Buchungen:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    console.error('❌ Fehler-Details:', {
      name: errorName,
      message: errorMessage,
      stack: errorStack
    });
    
    // Detaillierte Fehlermeldung für Development
    const errorDetails = process.env.NODE_ENV !== 'production' ? {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
      type: error instanceof Error ? error.constructor.name : typeof error
    } : undefined;
    
    return secureResponse(
      { 
        error: 'Fehler beim Laden der Buchungen',
        message: errorMessage,
        details: errorDetails
      },
      500
    );
  }
}
