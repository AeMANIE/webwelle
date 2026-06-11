import { NextResponse } from 'next/server';
import { customerLogin2FA } from '@/lib/auth';
import { verifyTAN } from '@/lib/tan-store';
import { validateEmail, validateTAN } from '@/lib/validation';
import { attachSessionToResponse } from '@/lib/session';
import { secureResponse } from '@/lib/api-security';

export async function POST(request: Request) {
  try {
    const { email, tan } = await request.json();
    
    console.log('📥 Verify-TAN API Request:', { 
      originalEmail: email, 
      tanLength: tan?.length 
    });
    
    // E-Mail normalisieren (toLowerCase für konsistente Speicherung/Abruf)
    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedTan = tan?.trim();
    
    console.log('📥 Normalisiert:', { 
      normalizedEmail, 
      tanLength: normalizedTan?.length 
    });
    
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

    // TAN gegen Store validieren (Redis) - mit normalisierter E-Mail
    console.log('🔍 Rufe verifyTAN auf mit:', { normalizedEmail, tanLength: normalizedTan.length });
    const tanStoreValidation = await verifyTAN(normalizedEmail, normalizedTan);
    console.log('🔍 verifyTAN Ergebnis:', { valid: tanStoreValidation.valid, message: tanStoreValidation.message });
    
    if (!tanStoreValidation.valid) {
      return NextResponse.json(
        { success: false, error: tanStoreValidation.message },
        { status: 401 }
      );
    }

    // Login durchführen (TAN wurde bereits verifiziert und gelöscht)
    const result = await customerLogin2FA(normalizedEmail, tan);
    
    if (result) {
      const response = secureResponse({
        success: true,
        user: result.user,
      });
      return attachSessionToResponse(response, result.user);
    } else {
      return NextResponse.json(
        { success: false, error: 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('TAN-Verifizierung Fehler:', error instanceof Error ? error.message : 'Unbekannter Fehler');
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
