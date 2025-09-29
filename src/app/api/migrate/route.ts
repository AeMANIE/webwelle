import { NextResponse } from 'next/server';
import { createTables } from '@/lib/database';

export async function GET() {
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
