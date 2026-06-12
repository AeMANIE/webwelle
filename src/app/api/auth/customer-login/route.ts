import { NextRequest, NextResponse } from 'next/server';
import { customerLogin, requestTAN } from '@/lib/auth';
import { attachSessionToResponse } from '@/lib/session';
import { secureResponse } from '@/lib/api-security';
import { resolveCustomerPasswordMaterial, verifyTanTrust } from '@/lib/tan-trust';
import { attachCustomerTanPendingCookie } from '@/lib/tan-pending-cookies';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const limiter = rateLimit(RATE_LIMITS.LOGIN);

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = await limiter(`customer-login:${ip}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const loginResult = await customerLogin(normalizedEmail, password);

    if (!loginResult) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    const passwordMaterial = await resolveCustomerPasswordMaterial(normalizedEmail);
    if (
      passwordMaterial &&
      verifyTanTrust(request, 'customer', normalizedEmail, passwordMaterial)
    ) {
      const response = secureResponse({
        success: true,
        user: loginResult.user,
      });
      return attachSessionToResponse(response, loginResult.user);
    }

    const tanResult = await requestTAN(normalizedEmail, password);
    if (!tanResult.success) {
      return NextResponse.json(
        { error: tanResult.message },
        { status: 401 }
      );
    }

    const response = secureResponse({
      success: true,
      requiresTan: true,
      message: tanResult.message,
      ...(process.env.NODE_ENV !== 'production' && tanResult.tan ? { tan: tanResult.tan } : {}),
    });

    await attachCustomerTanPendingCookie(
      response,
      normalizedEmail,
      process.env.NODE_ENV !== 'production' ? tanResult.tan : undefined
    );

    return response;
  } catch (error) {
    console.error('Customer Login Fehler:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
