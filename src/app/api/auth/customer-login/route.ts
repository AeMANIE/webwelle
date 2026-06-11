import { NextRequest, NextResponse } from 'next/server';
import { customerLogin } from '@/lib/auth';
import { attachSessionToResponse } from '@/lib/session';
import { secureResponse } from '@/lib/api-security';

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

    const response = secureResponse({
      success: true,
      user: result.user,
    });
    return attachSessionToResponse(response, result.user);

  } catch (error) {
    console.error('Customer Login Fehler:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
