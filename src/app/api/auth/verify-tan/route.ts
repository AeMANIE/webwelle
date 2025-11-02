import { NextResponse } from 'next/server';
import { customerLogin2FA } from '@/lib/auth';
import { verifyTAN } from '@/lib/tan-store';
import { validateEmail, validateTAN } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const { email, tan } = await request.json();
    console.log('Verify-TAN API:', { email, tan });
    
    // Input-Validierung
    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'E-Mail ist erforderlich' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      );
    }

    const tanValidation = validateTAN(tan);
    if (!tanValidation.isValid) {
      return NextResponse.json(
        { success: false, error: tanValidation.errors.tan },
        { status: 400 }
      );
    }

    // TAN gegen Store validieren (Redis)
    const tanStoreValidation = await verifyTAN(email, tan);
    if (!tanStoreValidation.valid) {
      return NextResponse.json(
        { success: false, error: tanStoreValidation.message },
        { status: 401 }
      );
    }

    // Login durchführen
    const result = await customerLogin2FA(email, tan);
    console.log('Verify-TAN Result:', result);
    
    if (result) {
      // HttpOnly Cookie setzen für sichere Token-Speicherung
      const response = NextResponse.json({ 
        success: true, 
        user: result.user
      });

      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 Stunden
        path: '/'
      });

      return response;
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
