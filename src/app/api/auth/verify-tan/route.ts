import { NextRequest, NextResponse } from 'next/server';
import { customerLogin2FA } from '@/lib/auth';
import { verifyTAN, deleteTAN } from '@/lib/tan-store';
import { validateEmail, validateTAN } from '@/lib/validation';
import { attachSessionToResponse } from '@/lib/session';
import { secureResponse } from '@/lib/api-security';

export async function POST(request: NextRequest) {
  try {
    const { email, tan } = await request.json();

    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedTan = tan?.trim();

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

    let tanValid = false;
    let tanErrorMessage = '';

    // Cookie zuerst (Serverless/Multi-Instanz – wie Admin)
    const tanCookie = request.cookies.get('customer-tan-pending')?.value;
    if (tanCookie) {
      try {
        const tanData = JSON.parse(tanCookie) as {
          email?: string;
          tan?: string;
          expiresAt?: number;
        };
        const cookieEmail = tanData.email?.toLowerCase().trim();

        if (cookieEmail === normalizedEmail) {
          if (tanData.expiresAt && Date.now() > tanData.expiresAt) {
            tanErrorMessage = 'TAN ist abgelaufen. Bitte fordern Sie eine neue TAN an.';
          } else if (tanData.tan === normalizedTan) {
            tanValid = true;
          } else {
            tanErrorMessage = 'Ungültiger TAN-Code. Bitte überprüfen Sie die Eingabe.';
          }
        } else {
          tanErrorMessage = 'TAN wurde für eine andere E-Mail-Adresse angefordert.';
        }
      } catch {
        tanErrorMessage = 'Fehler beim Lesen der TAN. Bitte fordern Sie eine neue TAN an.';
      }
    }

    // Fallback: Redis/In-Memory Store
    if (!tanValid && !tanErrorMessage) {
      const tanStoreValidation = await verifyTAN(normalizedEmail, normalizedTan);
      if (tanStoreValidation.valid) {
        tanValid = true;
      } else {
        tanErrorMessage = tanStoreValidation.message;
      }
    } else if (tanValid) {
      await deleteTAN(normalizedEmail);
    }

    if (!tanValid) {
      return NextResponse.json(
        { success: false, error: tanErrorMessage || 'Ungültiger TAN-Code' },
        { status: 401 }
      );
    }

    const result = await customerLogin2FA(normalizedEmail, normalizedTan);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.' },
        { status: 401 }
      );
    }

    const response = secureResponse({
      success: true,
      user: result.user,
    });
    await attachSessionToResponse(response, result.user);
    response.cookies.delete('customer-tan-pending');

    try {
      await deleteTAN(normalizedEmail);
    } catch {
      // ignore
    }

    return response;
  } catch (error) {
    console.error('TAN-Verifizierung Fehler:', error instanceof Error ? error.message : 'Unbekannter Fehler');
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
