import { NextResponse } from 'next/server';
import { adminLogin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort sind erforderlich' }, { status: 400 });
    }

    // Debug-Logging (nur in Development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 Admin Login Versuch:', {
        email,
        passwordLength: password.length,
        adminEmail: process.env.ADMIN_EMAIL,
        hashSet: !!process.env.ADMIN_PASSWORD_HASH,
      });
    }

    const result = await adminLogin(email, password);
    if (!result) {
      // Detailliertere Fehlermeldung für Debugging
      const errorDetails = {
        emailMatch: email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase(),
        hashSet: !!process.env.ADMIN_PASSWORD_HASH,
      };
      console.error('❌ Admin Login fehlgeschlagen:', errorDetails);
      return NextResponse.json({ 
        error: 'Ungültige Zugangsdaten',
        ...(process.env.NODE_ENV !== 'production' ? { debug: errorDetails } : {})
      }, { status: 401 });
    }

    const { token, user } = result;
    console.log('✅ Admin Login erfolgreich:', user.email);
    const response = NextResponse.json({ success: true, token, user });
    // Cookie serverseitig korrekt setzen
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('❌ Admin Login Fehler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten';
    return NextResponse.json({ 
      error: errorMessage,
      ...(process.env.NODE_ENV !== 'production' ? { stack: error instanceof Error ? error.stack : undefined } : {})
    }, { status: 500 });
  }
}
