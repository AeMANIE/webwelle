import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { AUTH_ACCESS_COOKIE } from '@/lib/auth-cookies';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_ACCESS_COOKIE)?.value;
    
    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = verifyAccessToken(token);
    
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error('Token-Verifizierung fehlgeschlagen:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}

