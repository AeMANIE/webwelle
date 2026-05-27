import { NextRequest, NextResponse } from 'next/server';
import { createTables } from '@/lib/database';
import { requireAdminAuth } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    await createTables();
    return NextResponse.json({ 
      success: true, 
      message: 'Datenbank-Tabellen erfolgreich erstellt' 
    });
  } catch (error) {
    console.error('Migration-Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Datenbank-Tabellen' },
      { status: 500 }
    );
  }
}
