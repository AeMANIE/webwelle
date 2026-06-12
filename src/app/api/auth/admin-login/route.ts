import { NextRequest, NextResponse } from 'next/server';
import { adminRequestTAN, buildStaffSessionUser, getAdminUsers } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { ensureEnvOwnerStaff } from '@/lib/database';
import { attachSessionToResponse } from '@/lib/session';
import { secureResponse } from '@/lib/api-security';
import { getAdminPasswordMaterial, issueTanTrustCookie, verifyTanTrust } from '@/lib/tan-trust';
import { attachAdminTanPendingCookie } from '@/lib/tan-pending-cookies';
import { rateLimit } from '@/lib/rate-limit';
import { logLoginAttempt } from '@/lib/security-logger';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 3,
});

async function validateAdminPassword(
  normalizedEmail: string,
  password: string
): Promise<boolean> {
  const adminUsers = getAdminUsers();
  const admin = adminUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!admin) return false;

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const passwordPlain = process.env.ADMIN_PASSWORD;

  if (passwordPlain) {
    return password === passwordPlain;
  }
  if (passwordHash) {
    return verifyPassword(password, passwordHash);
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = await limiter(`admin-login:${ip}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordValid = await validateAdminPassword(normalizedEmail, password);

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    const passwordMaterial = getAdminPasswordMaterial();
    if (
      passwordMaterial &&
      verifyTanTrust(request, 'admin', normalizedEmail, passwordMaterial)
    ) {
      const adminUsers = getAdminUsers();
      const admin = adminUsers.find((u) => u.email.toLowerCase() === normalizedEmail)!;
      const staff = await ensureEnvOwnerStaff(admin.email!, admin.name!);
      const user = buildStaffSessionUser(staff);

      logLoginAttempt(normalizedEmail, true);

      const response = secureResponse({
        success: true,
        user,
        message: 'Login erfolgreich',
      });
      return attachSessionToResponse(response, user);
    }

    const tanResult = await adminRequestTAN(normalizedEmail, password);
    if (!tanResult.success) {
      return NextResponse.json(
        { success: false, error: tanResult.message },
        { status: 401 }
      );
    }

    const response = secureResponse({
      success: true,
      requiresTan: true,
      message: tanResult.message,
      ...(process.env.NODE_ENV !== 'production' && tanResult.tan ? { tan: tanResult.tan } : {}),
    });

    await attachAdminTanPendingCookie(
      response,
      normalizedEmail,
      process.env.NODE_ENV !== 'production' ? tanResult.tan : undefined
    );

    return response;
  } catch (error) {
    console.error('Admin Login Fehler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
