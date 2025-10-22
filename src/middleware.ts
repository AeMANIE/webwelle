import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Edge-kompatible Token-Verifizierung mit Signatur-Validierung
async function verifyTokenEdge(token: string): Promise<{ role: string; exp: number } | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET ist nicht gesetzt');
      return null;
    }

    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    
    if (!payload || !payload.role || !payload.exp) return null;
    
    // Prüfe Ablaufzeit
    if (payload.exp < Date.now() / 1000) return null;
    
    return {
      role: payload.role as string,
      exp: payload.exp as number
    };
  } catch (error) {
    console.error('JWT-Verifizierung fehlgeschlagen:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const pathname = request.nextUrl.pathname;
  
  // Admin-Bereich schützen (außer Login-Seite)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    const payload = await verifyTokenEdge(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  // Kundenportal schützen (außer Login-Seite)
  if (pathname.startsWith('/customer') && pathname !== '/customer/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/customer/login', request.url));
    }
    
    const payload = await verifyTokenEdge(token);
    if (!payload || payload.role !== 'customer') {
      return NextResponse.redirect(new URL('/customer/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/customer/:path*']
};
