import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Temporäre Implementierung für Build-Fix
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    // Placeholder für Admin Login
    return NextResponse.json(
      { error: 'Admin Login temporär deaktiviert' },
      { status: 501 }
    );

  } catch (error) {
    console.error('Admin Login Fehler:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
