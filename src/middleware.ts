import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge-kompatible Token-Verifizierung
function verifyTokenEdge(token: string): { role: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    if (!payload || !payload.role || !payload.exp) return null;
    
    // Prüfe Ablaufzeit
    if (payload.exp < Date.now() / 1000) return null;
    
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const pathname = request.nextUrl.pathname;
  
  // Admin-Bereich schützen (außer Login-Seite)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    const payload = verifyTokenEdge(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  // Kundenportal schützen (außer Login-Seite)
  if (pathname.startsWith('/customer') && pathname !== '/customer/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/customer/login', request.url));
    }
    
    const payload = verifyTokenEdge(token);
    if (!payload || payload.role !== 'customer') {
      return NextResponse.redirect(new URL('/customer/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/customer/:path*']
};
