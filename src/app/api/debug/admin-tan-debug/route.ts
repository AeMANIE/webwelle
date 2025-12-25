import { NextRequest, NextResponse } from 'next/server';

/**
 * DEBUG-ROUTE: Zeigt alle TANs im Memory-Store
 * GET /api/debug/admin-tan-debug
 */
export async function GET(request: NextRequest) {
  try {
    // Nur in Development oder mit ALLOW_DEBUG_ROUTES
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEBUG_ROUTES !== 'true') {
      return NextResponse.json({ error: 'Debug-Route nur in Development verfügbar' }, { status: 403 });
    }

    // Zugriff auf den Memory-Store (intern)
    // @ts-expect-error - Zugriff auf internen Store für Debugging
    const { getTANMemory } = await import('@/lib/tan-store');
    
    // Test mit verschiedenen E-Mail-Varianten
    const testEmails = [
      'admin@webwelle.com',
      'Admin@WebWelle.com',
      'ADMIN@WEBWELLE.COM',
      'admin@webwelle.com ',
      ' admin@webwelle.com'
    ];

    const results: Record<string, unknown> = {};
    
    for (const email of testEmails) {
      try {
        const entry = getTANMemory(email);
        results[email] = entry ? {
          found: true,
          tan: entry.tan,
          expiresAt: new Date(entry.expiresAt).toISOString(),
          isExpired: Date.now() > entry.expiresAt
        } : { found: false };
      } catch (error) {
        results[email] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Versuche auch getAdminTAN zu verwenden
    const { getAdminTAN } = await import('@/lib/tan-store');
    const adminTanResult = await getAdminTAN('admin@webwelle.com');

    return NextResponse.json({
      message: 'TAN Debug Information',
      testEmails: results,
      getAdminTANResult: adminTanResult ? {
        found: true,
        tan: adminTanResult.tan,
        expiresAt: new Date(adminTanResult.expiresAt).toISOString(),
        isExpired: Date.now() > adminTanResult.expiresAt
      } : { found: false },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Debug TAN Fehler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    );
  }
}

