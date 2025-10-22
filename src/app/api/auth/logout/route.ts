import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // HttpOnly Cookie löschen
    const response = NextResponse.json({
      success: true,
      message: 'Erfolgreich abgemeldet'
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Sofort ablaufen lassen
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout Fehler:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

