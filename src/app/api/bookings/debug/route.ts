import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { verifyAccessToken } from '@/lib/auth';
import { blockInProduction } from '@/lib/prod-guard';
import { AUTH_ACCESS_COOKIE } from '@/lib/auth-cookies';

export async function GET(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;
  const debugSteps: Array<{ step: string; success: boolean; error?: string; data?: unknown }> = [];
  
  try {
    // Step 1: Cookie prüfen
    debugSteps.push({ step: '1. Cookie prüfen', success: false });
    const token = request.cookies.get(AUTH_ACCESS_COOKIE)?.value;
    if (!token) {
      debugSteps[0].error = 'Kein auth-token Cookie gefunden';
      return secureResponse({ debugSteps, error: 'Kein Token' }, 401);
    }
    debugSteps[0].success = true;
    debugSteps[0].data = { tokenLength: token.length, tokenPrefix: token.substring(0, 20) + '...' };

    // Step 2: Token verifizieren
    debugSteps.push({ step: '2. Token verifizieren', success: false });
    let user;
    try {
      user = verifyAccessToken(token);
      if (!user) {
        debugSteps[1].error = 'Token ist ungültig oder abgelaufen';
        return secureResponse({ debugSteps, error: 'Ungültiger Token' }, 401);
      }
      if (!['TEAM', 'ADMIN', 'OWNER'].includes(user.role)) {
        debugSteps[1].error = `Token hat Rolle: ${user.role}, erwartet: Staff-Rolle`;
        return secureResponse({ debugSteps, error: 'Keine Admin-Berechtigung' }, 403);
      }
      debugSteps[1].success = true;
      debugSteps[1].data = { userId: user.id, email: user.email, role: user.role };
    } catch (tokenError) {
      debugSteps[1].error = tokenError instanceof Error ? tokenError.message : 'Unbekannter Token-Fehler';
      return secureResponse({ debugSteps, error: 'Token-Verifizierung fehlgeschlagen' }, 500);
    }

    // Step 3: requireAdminAuth testen
    debugSteps.push({ step: '3. requireAdminAuth testen', success: false });
    try {
      const authResult = await requireAdminAuth(request, false); // Rate limiting deaktiviert für Debug
      if (authResult instanceof NextResponse) {
        const responseData = await authResult.json();
        debugSteps[2].error = `requireAdminAuth gab NextResponse zurück: ${JSON.stringify(responseData)}`;
        return secureResponse({ debugSteps, error: 'Auth fehlgeschlagen' }, 500);
      }
      debugSteps[2].success = true;
      debugSteps[2].data = { userId: authResult.user.id, email: authResult.user.email };
    } catch (authError) {
      debugSteps[2].error = authError instanceof Error ? authError.message : 'Unbekannter Auth-Fehler';
      return secureResponse({ debugSteps, error: 'requireAdminAuth fehlgeschlagen' }, 500);
    }

    // Step 4: Datenbankverbindung testen
    debugSteps.push({ step: '4. Datenbankverbindung testen', success: false });
    let client;
    let tempPool: import('pg').Pool | null = null;
    try {
      const { pool } = await import('@/lib/database');
      client = await pool.connect();
      debugSteps[3].success = true;
      debugSteps[3].data = { connectionType: 'normal' };
    } catch (connectionError) {
      const errorMsg = connectionError instanceof Error ? connectionError.message : '';
      if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify')) {
        const { Pool: TempPool } = await import('pg');
        tempPool = new TempPool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        });
        client = await tempPool.connect();
        debugSteps[3].success = true;
        debugSteps[3].data = { connectionType: 'ssl-fallback' };
      } else {
        debugSteps[3].error = errorMsg;
        return secureResponse({ debugSteps, error: 'Datenbankverbindung fehlgeschlagen' }, 500);
      }
    }

    // Step 5: Tabelle prüfen
    debugSteps.push({ step: '5. Tabelle webwelle_bookings prüfen', success: false });
    try {
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'webwelle_bookings'
        );
      `;
      const tableExists = await client.query(tableCheckQuery);
      if (!tableExists.rows[0]?.exists) {
        debugSteps[4].error = 'Tabelle existiert nicht';
        return secureResponse({ debugSteps, error: 'Tabelle fehlt' }, 500);
      }
      debugSteps[4].success = true;
    } catch (tableError) {
      debugSteps[4].error = tableError instanceof Error ? tableError.message : 'Unbekannter Fehler';
      return secureResponse({ debugSteps, error: 'Tabellen-Prüfung fehlgeschlagen' }, 500);
    }

    // Step 6: Test-Query
    debugSteps.push({ step: '6. Test-Query ausführen', success: false });
    try {
      const testQuery = 'SELECT COUNT(*) as count FROM webwelle_bookings';
      const result = await client.query(testQuery);
      debugSteps[5].success = true;
      debugSteps[5].data = { rowCount: parseInt(result.rows[0].count) };
    } catch (queryError) {
      debugSteps[5].error = queryError instanceof Error ? queryError.message : 'Unbekannter Fehler';
      return secureResponse({ debugSteps, error: 'Test-Query fehlgeschlagen' }, 500);
    }

    // Cleanup
    if (client) {
      client.release();
    }
    if (tempPool) {
      await tempPool.end();
    }

    return secureResponse({
      success: true,
      debugSteps,
      message: 'Alle Schritte erfolgreich'
    });

  } catch (error) {
    debugSteps.push({
      step: 'Fehler im Catch-Block',
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
    
    return secureResponse({
      success: false,
      debugSteps,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: process.env.NODE_ENV !== 'production' 
        ? (error instanceof Error ? error.stack : undefined) 
        : undefined
    }, 500);
  }
}

