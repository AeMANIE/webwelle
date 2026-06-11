import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken } from '@/lib/auth';
import { isStaffRole, type AppRole } from '@/lib/rbac';
import {
  AUTH_REFRESH_COOKIE,
  clearSessionCookies,
  setSessionCookies,
} from '@/lib/auth-cookies';
import { rotateRefreshToken } from '@/lib/refresh-token-store';
import { secureResponse } from '@/lib/api-security';

function loginPathForRole(role: AppRole): string {
  return isStaffRole(role) ? '/admin/login' : '/customer/login';
}

async function refreshSession(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get(AUTH_REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    const response = NextResponse.redirect(new URL('/customer/login', request.url));
    clearSessionCookies(response);
    return response;
  }

  const rotated = await rotateRefreshToken(refreshToken);
  if (!rotated) {
    const response = NextResponse.redirect(new URL('/customer/login', request.url));
    clearSessionCookies(response);
    return response;
  }

  const accessToken = createAccessToken(rotated.user);
  const redirectTo =
    request.nextUrl.searchParams.get('redirectTo') ||
    (isStaffRole(rotated.user.role) ? '/admin' : '/customer');

  const safeRedirect =
    redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : loginPathForRole(rotated.user.role);

  const response = NextResponse.redirect(new URL(safeRedirect, request.url));
  setSessionCookies(response, accessToken, rotated.newToken);
  return response;
}

export async function GET(request: NextRequest) {
  try {
    return await refreshSession(request);
  } catch (error) {
    console.error('Refresh GET Fehler:', error);
    const response = NextResponse.redirect(new URL('/customer/login', request.url));
    clearSessionCookies(response);
    return response;
  }
}

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(AUTH_REFRESH_COOKIE)?.value;
    if (!refreshToken) {
      const response = secureResponse({ authenticated: false, error: 'Nicht autorisiert' }, 401);
      clearSessionCookies(response);
      return response;
    }

    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) {
      const response = secureResponse({ authenticated: false, error: 'Session abgelaufen' }, 401);
      clearSessionCookies(response);
      return response;
    }

    const accessToken = createAccessToken(rotated.user);
    const response = secureResponse({ authenticated: true, user: rotated.user });
    setSessionCookies(response, accessToken, rotated.newToken);
    return response;
  } catch (error) {
    console.error('Refresh POST Fehler:', error);
    return secureResponse({ authenticated: false, error: 'Interner Serverfehler' }, 500);
  }
}
