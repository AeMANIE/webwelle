import { NextResponse } from 'next/server';
import { customerLogin2FA } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, tan } = await request.json();
    console.log('Verify-TAN API:', { email, tan });
    
    if (!email || !tan) {
      return NextResponse.json(
        { success: false, error: 'E-Mail und TAN sind erforderlich' },
        { status: 400 }
      );
    }

    // Für Entwicklung: Direkte TAN-Validierung ohne Store
    // Prüfe ob TAN 6-stellig und numerisch ist
    if (!/^\d{6}$/.test(tan)) {
      return NextResponse.json(
        { success: false, error: 'TAN muss 6-stellig und numerisch sein' },
        { status: 401 }
      );
    }

    // Login durchführen
    const result = await customerLogin2FA(email, tan);
    console.log('Verify-TAN Result:', result);
    
    if (result) {
      return NextResponse.json({ 
        success: true, 
        user: result.user, 
        token: result.token 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Login fehlgeschlagen' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('TAN-Verifizierung Fehler:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
