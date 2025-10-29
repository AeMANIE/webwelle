import { NextResponse } from 'next/server';
import { adminLogin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort sind erforderlich' }, { status: 400 });
    }

    const result = await adminLogin(email, password);
    if (!result) {
      return NextResponse.json({ error: 'Ungültige Zugangsdaten' }, { status: 401 });
    }

    const { token, user } = result;
    const response = NextResponse.json({ success: true, token, user });
    response.headers.append(
      'Set-Cookie',
      `auth-token=${token}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Strict`
    );
    return response;
  } catch (error) {
    console.error('Admin Login Fehler:', error);
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten' }, { status: 500 });
  }
}
