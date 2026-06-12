import { NextResponse } from 'next/server';
import { requestTAN } from '@/lib/auth';
import { attachCustomerTanPendingCookie } from '@/lib/tan-pending-cookies';

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

    await attachCustomerTanPendingCookie(
      response,
      normalizedEmail,
      process.env.NODE_ENV !== 'production' ? result.tan : undefined
    );

    return response;
  } catch (error) {
    console.error('TAN-Anfrage Fehler:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
