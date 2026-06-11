import { NextResponse } from 'next/server';

export const AUTH_ACCESS_COOKIE = 'auth-token';
export const AUTH_REFRESH_COOKIE = 'refresh-token';
export const FUNNEL_TOKEN_COOKIE = 'wf_token';

export const ACCESS_MAX_AGE = 15 * 60;
export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;
export const FUNNEL_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getSessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  };
}

export function getFunnelCookieOptions(maxAge = FUNNEL_TOKEN_MAX_AGE) {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function setAccessTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_ACCESS_COOKIE, token, getSessionCookieOptions(ACCESS_MAX_AGE));
}

export function setRefreshTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_REFRESH_COOKIE, token, getSessionCookieOptions(REFRESH_MAX_AGE));
}

export function setSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  setAccessTokenCookie(response, accessToken);
  setRefreshTokenCookie(response, refreshToken);
}

export function clearSessionCookies(response: NextResponse): void {
  const cleared = { ...getSessionCookieOptions(0), maxAge: 0 };
  response.cookies.set(AUTH_ACCESS_COOKIE, '', cleared);
  response.cookies.set(AUTH_REFRESH_COOKIE, '', cleared);
}

export function setFunnelTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(FUNNEL_TOKEN_COOKIE, token, getFunnelCookieOptions());
}
