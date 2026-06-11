import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { Pool } from 'pg';
import { blockInProduction } from '@/lib/prod-guard';

export async function GET(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;

  try {
    // Admin-Auth
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const dbUrl = process.env.DATABASE_URL;
    
    // Prüfe ob DATABASE_URL gesetzt ist
    if (!dbUrl) {
      return secureResponse({
        error: 'DATABASE_URL nicht gesetzt',
        solution: 'Bitte setzen Sie die DATABASE_URL Umgebungsvariable'
      }, 500);
    }

    // Parse URL (ohne Passwort anzuzeigen)
    let parsedUrl;
    try {
      parsedUrl = new URL(dbUrl);
      // Erstelle URL ohne Passwort für Anzeige
      const displayUrl = `${parsedUrl.protocol}//${parsedUrl.username}:***@${parsedUrl.hostname}:${parsedUrl.port}${parsedUrl.pathname}${parsedUrl.search}`;
      
      return secureResponse({
        success: true,
        databaseUrl: {
          host: parsedUrl.hostname,
          port: parsedUrl.port,
          database: parsedUrl.pathname.replace('/', ''),
          username: parsedUrl.username,
          hasPassword: !!parsedUrl.password,
          passwordLength: parsedUrl.password?.length || 0,
          sslMode: parsedUrl.searchParams.get('sslmode'),
          displayUrl
        },
        testConnection: 'Bitte verwenden Sie /api/bookings/debug für einen Verbindungstest'
      });
    } catch (urlError) {
      return secureResponse({
        error: 'DATABASE_URL konnte nicht geparst werden',
        urlError: urlError instanceof Error ? urlError.message : 'Unbekannter Fehler',
        databaseUrlLength: dbUrl.length,
        databaseUrlPrefix: dbUrl.substring(0, 30) + '...'
      }, 500);
    }
  } catch (error) {
    return secureResponse({
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, 500);
  }
}

