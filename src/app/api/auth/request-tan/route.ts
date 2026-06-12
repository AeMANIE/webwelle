import { NextResponse } from 'next/server';
import { requestTAN } from '@/lib/auth';
import { getTAN } from '@/lib/tan-store';

function attachCustomerTanCookie(
  response: NextResponse,
  normalizedEmail: string,
  tan: string,
  expiresAt: number
): void {
  const tanData = JSON.stringify({
    email: normalizedEmail,
    tan,
    expiresAt,
  });
  response.cookies.set('customer-tan-pending', tanData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: Math.max(60, Math.floor((expiresAt - Date.now()) / 1000)),
    path: '/',
  });
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await requestTAN(normalizedEmail, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: result.message,
      ...(process.env.NODE_ENV !== 'production' && result.tan ? { tan: result.tan } : {}),
    });

    // Cookie für Serverless/Multi-Instanz (wie Admin-TAN)
    const tanEntry = result.tan
      ? { tan: result.tan, expiresAt: Date.now() + 10 * 60 * 1000 }
      : await getTAN(normalizedEmail);

    if (tanEntry) {
      attachCustomerTanCookie(response, normalizedEmail, tanEntry.tan, tanEntry.expiresAt);
    }

    return response;
  } catch (error) {
    console.error('TAN-Anfrage Fehler:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
