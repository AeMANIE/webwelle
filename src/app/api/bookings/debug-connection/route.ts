import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { correctDatabaseUrl, createTempPool } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Admin-Auth
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return secureResponse({
        error: 'DATABASE_URL nicht gesetzt'
      }, 500);
    }

    const debugInfo: Record<string, unknown> = {
      step1_originalUrl: {
        length: dbUrl.length,
        prefix: dbUrl.substring(0, 50) + '...',
        hasPassword: dbUrl.includes('@') && dbUrl.split('@').length > 1
      }
    };

    // Schritt 1: Parse Original-URL
    let originalUrl;
    try {
      originalUrl = new URL(dbUrl);
      debugInfo.step2_parsedOriginal = {
        protocol: originalUrl.protocol,
        hostname: originalUrl.hostname,
        port: originalUrl.port,
        username: originalUrl.username,
        pathname: originalUrl.pathname,
        database_from_pathname: originalUrl.pathname.replace(/^\//, ''),
        hasPassword: !!originalUrl.password,
        passwordLength: originalUrl.password?.length || 0,
        sslMode: originalUrl.searchParams.get('sslmode'),
        search: originalUrl.search
      };
    } catch (urlError) {
      return secureResponse({
        error: 'URL-Parsing fehlgeschlagen',
        urlError: urlError instanceof Error ? urlError.message : 'Unbekannt',
        debugInfo
      }, 500);
    }

    // Schritt 2: Korrigiere URL
    let correctedUrl;
    try {
      correctedUrl = correctDatabaseUrl(dbUrl);
      const correctedUrlParsed = new URL(correctedUrl);
      debugInfo.step3_correctedUrl = {
        fullUrl: correctedUrl.substring(0, 50) + '...',
        pathname: correctedUrlParsed.pathname,
        database_from_pathname: correctedUrlParsed.pathname.replace(/^\//, ''),
        username: correctedUrlParsed.username,
        hasPassword: !!correctedUrlParsed.password,
        passwordLength: correctedUrlParsed.password?.length || 0,
        hostname: correctedUrlParsed.hostname,
        port: correctedUrlParsed.port
      };
    } catch (correctError) {
      return secureResponse({
        error: 'URL-Korrektur fehlgeschlagen',
        correctError: correctError instanceof Error ? correctError.message : 'Unbekannt',
        debugInfo
      }, 500);
    }

    // Schritt 3: Teste Verbindung mit korrigierter URL
    let connectionTest;
    try {
      // Teste auch mit connectionString (Fallback)
      const { Pool } = await import('pg');
      const tempPool = await createTempPool({ rejectUnauthorized: false });
      const client = await tempPool.connect();
      
      try {
        const testQuery = await client.query('SELECT NOW() as current_time, current_database() as database_name, current_user as current_user');
        connectionTest = {
          success: true,
          currentTime: testQuery.rows[0]?.current_time,
          databaseName: testQuery.rows[0]?.database_name,
          currentUser: testQuery.rows[0]?.current_user
        };
      } finally {
        client.release();
        await tempPool.end();
      }
    } catch (connError) {
      const errorMsg = connError instanceof Error ? connError.message : 'Unbekannter Fehler';
      
      // Versuche auch mit connectionString als Fallback
      let fallbackTest;
      try {
        const { Pool } = await import('pg');
        const fallbackPool = new Pool({
          connectionString: correctedUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000
        });
        const fallbackClient = await fallbackPool.connect();
        try {
          await fallbackClient.query('SELECT 1');
          fallbackTest = { success: true, method: 'connectionString' };
        } finally {
          fallbackClient.release();
          await fallbackPool.end();
        }
      } catch (fallbackError) {
        fallbackTest = {
          success: false,
          error: fallbackError instanceof Error ? fallbackError.message : 'Unbekannt',
          method: 'connectionString'
        };
      }
      
      connectionTest = {
        success: false,
        error: errorMsg,
        isPasswordError: errorMsg.includes('password authentication failed'),
        isSSLError: errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS'),
        fallbackTest: fallbackTest,
        recommendation: errorMsg.includes('password authentication failed') 
          ? 'Das Passwort in der DATABASE_URL ist falsch. Bitte überprüfen Sie: 1) Ist das Passwort in der .env-Datei korrekt? 2) Enthält das Passwort Sonderzeichen, die URL-encoded werden müssen? 3) Stimmt der Benutzername (postgres)?'
          : 'Bitte überprüfen Sie die DATABASE_URL in Ihrer .env-Datei'
      };
    }

    debugInfo.step4_connectionTest = connectionTest;

    // Schritt 4: Prüfe ob Tabelle existiert
    if (connectionTest.success) {
      try {
        const tempPool = await createTempPool({ rejectUnauthorized: false });
        const client = await tempPool.connect();
        
        try {
          const tableCheck = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'webwelle_bookings'
            ) as exists;
          `);
          debugInfo.step5_tableCheck = {
            tableExists: tableCheck.rows[0]?.exists || false
          };
        } finally {
          client.release();
          await tempPool.end();
        }
      } catch (tableError) {
        debugInfo.step5_tableCheck = {
          error: tableError instanceof Error ? tableError.message : 'Unbekannt'
        };
      }
    }

    return secureResponse({
      success: true,
      debugInfo,
      summary: {
        urlParsed: !!originalUrl,
        urlCorrected: !!correctedUrl,
        connectionSuccessful: connectionTest.success,
        tableExists: (debugInfo.step5_tableCheck as { tableExists?: boolean })?.tableExists || false
      }
    });
  } catch (error) {
    return secureResponse({
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
}

