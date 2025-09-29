import { NextResponse } from 'next/server';
import { createTAN, verifyTAN, getTANStatus } from '@/lib/tan';

export async function GET() {
  try {
    const email = 'test@example.com';
    const tan = '123456';
    
    // TAN erstellen
    createTAN(email, tan);
    console.log('TAN erstellt:', { email, tan });
    
    // TAN-Status prüfen
    const status = getTANStatus(email);
    console.log('TAN-Status:', status);
    
    // TAN verifizieren
    const result = verifyTAN(email, tan);
    console.log('TAN-Verifizierung:', result);
    
    return NextResponse.json({
      success: true,
      message: 'TAN-Test erfolgreich',
      data: {
        created: { email, tan },
        status,
        verification: result
      }
    });
  } catch (error) {
    console.error('TAN-Test Fehler:', error);
    return NextResponse.json(
      { success: false, error: 'TAN-Test fehlgeschlagen' },
      { status: 500 }
    );
  }
}
