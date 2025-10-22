import { NextRequest, NextResponse } from 'next/server';
import { customerLogin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    const result = await customerLogin(email, password);

    if (!result) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    // HttpOnly Cookie setzen für sichere Token-Speicherung
    const response = NextResponse.json({
      success: true,
      user: result.user
    });

    response.cookies.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 Stunden
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Customer Login Fehler:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
