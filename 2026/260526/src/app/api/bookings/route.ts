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
      const isHostnameError = errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo');
      
      // Hostname-Fehler: Versuche automatisch mit DATABASE_PUBLICURL
      if (isHostnameError) {
        console.warn('⚠️ Bookings API - Interne URL kann nicht aufgelöst werden, versuche DATABASE_PUBLICURL...');
        
        // Versuche mit DATABASE_PUBLICURL, falls verfügbar
        const publicUrl = process.env.DATABASE_PUBLICURL;
        if (publicUrl) {
          let publicTempPool: import('pg').Pool | null = null;
          try {
            const { Pool: TempPool } = await import('pg');
            publicTempPool = new TempPool({
              connectionString: publicUrl,
              ssl: publicUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
              connectionTimeoutMillis: 10000,
            });
            
            client = await publicTempPool.connect();
            tempPool = publicTempPool; // Setze tempPool für späteres Cleanup
            console.log('✅ Bookings API - Verbindung mit DATABASE_PUBLICURL erfolgreich');
          } catch (publicUrlError) {
            const publicErrorMsg = publicUrlError instanceof Error ? publicUrlError.message : '';
            console.error('❌ Bookings API - Auch DATABASE_PUBLICURL fehlgeschlagen:', publicErrorMsg);
            
            if (publicTempPool) await publicTempPool.end();
            
            return secureResponse(
              {
                error: 'Datenbank nicht erreichbar',
                message: 'Die Datenbank-Verbindung konnte weder mit der internen noch mit der öffentlichen URL hergestellt werden.',
                solution: 'Bitte überprüfen Sie die DATABASE_URL und DATABASE_PUBLICURL in Ihrer .env-Datei. Stellen Sie sicher, dass die Datenbank erreichbar ist.',
                details: process.env.NODE_ENV !== 'production' ? {
                  internalError: errorMsg,
                  publicError: publicErrorMsg
                } : undefined
              },
              500
            );
          }
        } else {
          // Keine DATABASE_PUBLICURL verfügbar
          console.error('❌ Bookings API - Datenbank-Hostname kann nicht aufgelöst werden und DATABASE_PUBLICURL ist nicht gesetzt:', errorMsg);
          return secureResponse(
            {
              error: 'Datenbank nicht erreichbar',
              message: 'Die Datenbank-Verbindung konnte nicht hergestellt werden. Der Datenbank-Hostname kann nicht aufgelöst werden.',
              solution: 'Bitte überprüfen Sie die DATABASE_URL in Ihrer .env-Datei oder setzen Sie DATABASE_PUBLICURL für externe Verbindungen.',
              details: process.env.NODE_ENV !== 'production' ? {
                hostname: errorMsg.match(/hostname: '([^']+)'/)?.[1] || 'unbekannt',
                error: errorMsg
              } : undefined
            },
            500
          );
        }
      }
      
      // SSL/Passwort-Fehler: Versuche Fallback mit DATABASE_URL (für VPS)
      // Bei SSL-Fehlern verwenden wir immer die interne URL, da wir auf dem VPS sind
      if (isSSLError || isPasswordError) {
        // Verwende die zentrale Funktion aus database.ts
        const { createTempPool } = await import('@/lib/database');
        
        // Bei SSL-Fehlern: Verwende DATABASE_URL (interne URL für VPS)
        // usePublicUrl = false, da wir auf dem VPS sind und die interne URL verwenden sollten
        
        tempPool = await createTempPool({ rejectUnauthorized: false }, false); // false = verwende DATABASE_URL (VPS)
        
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
              const { correctDatabaseUrl, getDatabaseUrl } = await import('@/lib/database');
              const dbUrl = getDatabaseUrl(false); // false = verwende DATABASE_URL (VPS)
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
        // Unbekannter Verbindungsfehler
        console.error('❌ Bookings API - Unbekannter Verbindungsfehler:', errorMsg);
        return secureResponse(
          {
            error: 'Datenbank-Verbindung fehlgeschlagen',
            message: errorMsg,
            solution: 'Bitte überprüfen Sie die DATABASE_URL in Ihrer .env-Datei und stellen Sie sicher, dass die Datenbank erreichbar ist.',
            details: process.env.NODE_ENV !== 'production' ? {
              error: errorMsg
            } : undefined
          },
          500
        );
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
