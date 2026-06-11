import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { countryToMarket } from '@/lib/funnel/market';
import {
  AUTH_ACCESS_COOKIE,
  AUTH_REFRESH_COOKIE,
  FUNNEL_TOKEN_COOKIE,
  FUNNEL_TOKEN_MAX_AGE,
  getFunnelCookieOptions,
} from '@/lib/auth-cookies';
import { isCustomerRoleName, isStaffRoleName } from '@/lib/rbac';

async function verifyAccessTokenEdge(token: string): Promise<{ role: string; exp: number } | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET ist nicht gesetzt');
      return null;
    }

    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);

    if (!payload?.role || !payload?.exp) return null;
    if (payload.typ && payload.typ !== 'access') return null;
    if (payload.exp < Date.now() / 1000) return null;

    return {
      role: payload.role as string,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

function redirectToRefresh(request: NextRequest, pathname: string): NextResponse {
  const refreshUrl = new URL('/api/auth/refresh', request.url);
  refreshUrl.searchParams.set('redirectTo', pathname);
  return NextResponse.redirect(refreshUrl);
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  if (hostname.startsWith('www.')) {
    const newHostname = hostname.replace('www.', '');
    return NextResponse.redirect(
      new URL(`${url.pathname}${url.search}`, `https://${newHostname}`),
      301
    );
  }

  const token = request.cookies.get(AUTH_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(AUTH_REFRESH_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!token && !refreshToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (!token) {
      return redirectToRefresh(request, pathname);
    }

    const payload = await verifyAccessTokenEdge(token);
    if (!payload || !isStaffRoleName(payload.role)) {
      if (refreshToken) {
        return redirectToRefresh(request, pathname);
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  const isPublicCustomerRoute =
    pathname === '/customer/login' || pathname === '/customer/activate';

  if (pathname.startsWith('/customer') && !isPublicCustomerRoute) {
    if (!token && !refreshToken) {
      return NextResponse.redirect(new URL('/customer/login', request.url));
    }

    if (!token) {
      return redirectToRefresh(request, pathname);
    }

    const payload = await verifyAccessTokenEdge(token);
    if (!payload || !isCustomerRoleName(payload.role)) {
      if (refreshToken) {
        return redirectToRefresh(request, pathname);
      }
      return NextResponse.redirect(new URL('/customer/login', request.url));
    }
  }

  const response = NextResponse.next();

  const tokenFromQuery = url.searchParams.get('t');
  if (tokenFromQuery && pathname.startsWith('/funnel')) {
    response.cookies.set(FUNNEL_TOKEN_COOKIE, tokenFromQuery, getFunnelCookieOptions(FUNNEL_TOKEN_MAX_AGE));
  }

  const countryHeader =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry');
  const market = countryToMarket(countryHeader);
  const existingMarket = request.cookies.get('market')?.value;
  if (market && existingMarket !== market) {
    response.cookies.set('market', market, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp|woff|woff2|ttf|eot)).*)',
  ],
};
