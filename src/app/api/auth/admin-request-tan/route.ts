import { NextResponse } from 'next/server';
import { requestAdminTAN } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    const result = await requestAdminTAN(email, password);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: result.message,
      // TAN nur in Development zurückgeben (Sicherheit)
      tan: process.env.NODE_ENV !== 'production' ? result.tan : undefined
    });
  } catch (error) {
    console.error('❌ Fehler beim Anfordern der Admin-TAN:', error);
    return NextResponse.json(
      { success: false, error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

