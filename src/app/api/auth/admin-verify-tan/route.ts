import { NextResponse } from 'next/server';
import { adminLogin2FA } from '@/lib/auth';
import { verifyTAN } from '@/lib/tan-store';
import { validateEmail, validateTAN } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const { email, tan } = await request.json();
    
    // E-Mail normalisieren
    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedTan = tan?.trim();
    
    // Input-Validierung
    if (!normalizedEmail) {
      return NextResponse.json(
        { success: false, error: 'E-Mail ist erforderlich' },
        { status: 400 }
      );
    }

    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      );
    }

    const tanValidation = validateTAN(normalizedTan);
    if (!tanValidation.isValid) {
      return NextResponse.json(
        { success: false, error: tanValidation.errors.tan },
        { status: 400 }
      );
    }

    // TAN gegen Store validieren (Redis)
    const tanStoreValidation = await verifyTAN(normalizedEmail, normalizedTan);
    
    if (!tanStoreValidation.valid) {
      return NextResponse.json(
        { success: false, error: tanStoreValidation.message },
        { status: 401 }
      );
    }

    // Login durchführen (TAN wurde bereits verifiziert und gelöscht)
    const result = await adminLogin2FA(normalizedEmail, tan);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Login fehlgeschlagen' },
        { status: 401 }
      );
    }

    const { token, user } = result;
    
    // HttpOnly Cookie setzen für sichere Token-Speicherung
    const response = NextResponse.json({ 
      success: true, 
      token, 
      user 
    });
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 Stunden
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('❌ Fehler bei Admin-TAN-Verifizierung:', error);
    return NextResponse.json(
      { success: false, error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

