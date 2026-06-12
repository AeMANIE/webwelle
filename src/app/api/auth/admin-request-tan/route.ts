import { NextResponse } from 'next/server';
import { adminRequestTAN } from '@/lib/auth';
import { attachAdminTanPendingCookie } from '@/lib/tan-pending-cookies';
import { rateLimit } from '@/lib/rate-limit';

// Rate Limiting: Max. 3 TAN-Anfragen pro 15 Minuten pro IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  maxRequests: 3, // Max. 3 Versuche
});

export async function POST(request: Request) {
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = await limiter(`admin-tan-request:${ip}`);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    const result = await adminRequestTAN(email, password);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 401 }
      );
    }

    // TAN wurde gesendet - JETZT: TAN auch in Cookie speichern (für Serverless-Kompatibilität)
    const normalizedEmail = email.toLowerCase().trim();
    const response = NextResponse.json({
      success: true,
      message: result.message,
      // Nur in Development: TAN zurückgeben
      ...(process.env.NODE_ENV !== 'production' && result.tan ? { tan: result.tan } : {})
    });

    await attachAdminTanPendingCookie(
      response,
      normalizedEmail,
      process.env.NODE_ENV !== 'production' ? result.tan : undefined
    );

    return response;
  } catch (error) {
    console.error('❌ Admin-TAN-Anfrage Fehler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

