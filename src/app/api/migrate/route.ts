import { NextRequest, NextResponse } from 'next/server';
import { createTables } from '@/lib/database';
import { requireAdminAuth } from '@/lib/api-security';
import { blockInProduction } from '@/lib/prod-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const blocked = blockInProduction();
  if (blocked) return blocked;

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
