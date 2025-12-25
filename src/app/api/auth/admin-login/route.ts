import { NextResponse } from 'next/server';
import { adminRequestTAN } from '@/lib/auth';

/**
 * DEPRECATED: Diese Route ist veraltet.
 * Verwenden Sie stattdessen:
 * 1. POST /api/auth/admin-request-tan (Email + Passwort → TAN anfordern)
 * 2. POST /api/auth/admin-verify-tan (Email + TAN → Login)
 * 
 * Diese Route leitet automatisch zur TAN-Anfrage weiter.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'E-Mail und Passwort sind erforderlich',
        requiresTAN: true 
      }, { status: 400 });
    }

    // Weiterleitung zur TAN-Anfrage
    const result = await adminRequestTAN(email, password);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: result.message,
        requiresTAN: true 
      }, { status: 401 });
    }

    // TAN wurde angefordert - Frontend muss jetzt TAN-Eingabe zeigen
    return NextResponse.json({ 
      success: true,
      requiresTAN: true,
      message: result.message,
      ...(process.env.NODE_ENV !== 'production' && result.tan ? { tan: result.tan } : {})
    });
  } catch (error) {
    console.error('❌ Admin Login Fehler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten';
    return NextResponse.json({ 
      error: errorMessage,
      requiresTAN: true
    }, { status: 500 });
  }
}
