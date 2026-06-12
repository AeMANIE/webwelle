import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminTAN } from '@/lib/tan-store';
import { validateEmail, validateTAN } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { buildStaffSessionUser, getAdminUsers } from '@/lib/auth';
import { ensureEnvOwnerStaff } from '@/lib/database';
import { attachSessionToResponse } from '@/lib/session';
import { secureResponse } from '@/lib/api-security';
import { logLoginAttempt } from '@/lib/security-logger';
import { getAdminPasswordMaterial, issueTanTrustCookie } from '@/lib/tan-trust';

// Rate Limiting: Max. 10 TAN-Verifizierungen pro 15 Minuten pro IP
// Erhöht, da TANs manchmal falsch eingegeben werden
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  maxRequests: 10, // Max. 10 Versuche (vorher 5)
});

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = await limiter(`admin-tan-verify:${ip}`);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
        { status: 429 }
      );
    }

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

    // NEUE LÖSUNG: TAN aus Cookie prüfen (funktioniert über Serverless-Instanzen hinweg)
    const tanCookie = request.cookies.get('admin-tan-pending')?.value;
    let tanValid = false;
    let tanErrorMessage = '';

    if (tanCookie) {
      try {
        const tanData = JSON.parse(tanCookie);
        const cookieEmail = tanData.email?.toLowerCase().trim();
        const cookieTan = tanData.tan;
        const cookieExpiresAt = tanData.expiresAt;

        console.log('🔍 TAN aus Cookie:', { cookieEmail, normalizedEmail, match: cookieEmail === normalizedEmail });

        if (cookieEmail === normalizedEmail) {
          if (Date.now() > cookieExpiresAt) {
            tanErrorMessage = 'TAN ist abgelaufen. Bitte fordern Sie eine neue TAN an.';
          } else if (cookieTan === normalizedTan) {
            tanValid = true;
            console.log('✅ TAN aus Cookie verifiziert!');
          } else {
            tanErrorMessage = 'Ungültiger TAN-Code. Bitte überprüfen Sie die Eingabe.';
            console.log('❌ TAN stimmt nicht überein:', { cookieTan, inputTan: normalizedTan });
          }
        } else {
          tanErrorMessage = 'TAN wurde für eine andere E-Mail-Adresse angefordert.';
        }
      } catch (error) {
        console.error('❌ Fehler beim Parsen des TAN-Cookies:', error);
        tanErrorMessage = 'Fehler beim Lesen der TAN. Bitte fordern Sie eine neue TAN an.';
      }
    }

    // Fallback: TAN aus Store prüfen (für Kompatibilität)
    if (!tanValid && !tanErrorMessage) {
      const { verifyAdminTAN } = await import('@/lib/tan-store');
      const tanVerifyResult = await verifyAdminTAN(normalizedEmail, normalizedTan, false);
      
      if (tanVerifyResult.valid) {
        tanValid = true;
        console.log('✅ TAN aus Store verifiziert!');
      } else {
        tanErrorMessage = tanVerifyResult.message;
        console.log('❌ TAN-Verifizierung aus Store fehlgeschlagen:', tanVerifyResult.message);
      }
    }

    if (!tanValid) {
      return NextResponse.json(
        { success: false, error: tanErrorMessage || 'Ungültiger TAN-Code' },
        { status: 401 }
      );
    }

    const adminUsers = getAdminUsers();
    const admin = adminUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    
    if (!admin) {
      console.error('❌ Admin-Benutzer nicht gefunden für:', normalizedEmail);
      return NextResponse.json(
        { success: false, error: 'Admin-Benutzer nicht gefunden' },
        { status: 401 }
      );
    }

    const staff = await ensureEnvOwnerStaff(admin.email!, admin.name!);
    const user = buildStaffSessionUser(staff);

    logLoginAttempt(normalizedEmail, true);

    const response = secureResponse({
      success: true,
      user,
      message: 'Login erfolgreich',
    });
    await attachSessionToResponse(response, user);

    const passwordMaterial = getAdminPasswordMaterial();
    if (passwordMaterial) {
      issueTanTrustCookie(response, 'admin', user, passwordMaterial);
    }

    response.cookies.delete('admin-tan-pending');
    
    // TAN auch aus Store löschen (falls vorhanden)
    try {
      const { deleteAdminTAN } = await import('@/lib/tan-store');
      await deleteAdminTAN(normalizedEmail);
    } catch (error) {
      console.error('⚠️ Fehler beim Löschen der TAN aus Store:', error);
    }
    
    console.log('✅ Admin-Login erfolgreich für:', normalizedEmail);
    return response;
  } catch (error) {
    console.error('❌ Admin-TAN-Verifizierung Fehler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

