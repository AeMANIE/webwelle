import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { getBookingBySessionId } from '@/lib/database';

/**
 * Debug-Route zum Prüfen des E-Mail-Status für eine Session
 * Nützlich zum Debugging, wenn keine E-Mail empfangen wurde
 */
export async function GET(request: NextRequest) {
  // Sicherheit: Nur in Development oder mit ALLOW_DEBUG_ROUTES Flag
  if (process.env.NODE_ENV === 'production') {
    const allowDebug = process.env.ALLOW_DEBUG_ROUTES === 'true';
    if (!allowDebug) {
      return NextResponse.json({
        success: false,
        error: 'Route nur mit ALLOW_DEBUG_ROUTES=true verfügbar'
      }, { status: 403 });
    }
  }

  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID ist erforderlich (Query-Parameter: ?sessionId=xxx)' },
        { status: 400 }
      );
    }

    // 1. Prüfe Redis-Status
    const redis = getRedisClient();
    const emailSentKey = `email_sent:${sessionId}`;
    let redisStatus = 'unknown';
    let emailSentInRedis = false;
    
    if (redis && (await redis.status) === 'ready') {
      redisStatus = 'ready';
      const emailSentValue = await redis.get(emailSentKey);
      emailSentInRedis = !!emailSentValue;
      
      // TTL prüfen
      const ttl = await redis.ttl(emailSentKey);
      const ttlHoursNum = ttl > 0 ? ttl / 3600 : 0;
      const ttlHoursStr = ttlHoursNum.toFixed(2);
      
      // 2. Buchung aus Datenbank laden
      const booking = await getBookingBySessionId(sessionId);
      
      // 3. E-Mail-Konfiguration prüfen
      const emailConfig = {
        EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER ? '✅ gesetzt' : '❌ fehlt',
        EMAIL_SMTP_PASSWORD: process.env.EMAIL_SMTP_PASSWORD ? '✅ gesetzt' : '❌ fehlt',
        EMAIL_FROM: process.env.EMAIL_FROM || 'info@webwelle.com',
      };
      
      return NextResponse.json({
        success: true,
        sessionId,
        redis: {
          status: redisStatus,
          emailSentKey,
          emailAlreadySent: emailSentInRedis,
          ttlSeconds: ttl,
          ttlHours: ttlHoursNum > 0 ? `${ttlHoursStr} Stunden` : 'abgelaufen/nicht vorhanden',
          message: emailSentInRedis 
            ? `⚠️ E-Mail wurde bereits als gesendet markiert (TTL: ${ttlHoursStr} Stunden). Dies verhindert erneutes Senden.`
            : '✅ E-Mail wurde noch nicht als gesendet markiert - kann gesendet werden.',
        },
        booking: booking ? {
          found: true,
          customerEmail: booking.customer_email,
          customerName: booking.customer_name,
          packageType: booking.package_type,
          status: booking.status,
          createdAt: booking.created_at,
        } : {
          found: false,
          message: 'Buchung nicht in Datenbank gefunden',
        },
        emailConfig,
        recommendations: [
          emailSentInRedis && ttl > 0 
            ? `Redis blockiert erneutes Senden. TTL: ${ttlHoursStr} Stunden. Verwenden Sie /api/manual-send-booking-email mit force=true (wenn implementiert) oder löschen Sie den Redis-Key manuell.`
            : null,
          !emailConfig.EMAIL_SMTP_USER.includes('✅') || !emailConfig.EMAIL_SMTP_PASSWORD.includes('✅')
            ? 'E-Mail-Konfiguration fehlt oder ist unvollständig. Prüfen Sie .env.local'
            : null,
          !booking 
            ? 'Buchung nicht in Datenbank gefunden. Prüfen Sie, ob der Webhook korrekt ausgeführt wurde.'
            : null,
        ].filter(Boolean),
      });
    } else {
      redisStatus = 'not_ready';
      
      // Buchung trotzdem laden, auch wenn Redis nicht verfügbar ist
      const booking = await getBookingBySessionId(sessionId);
      
      return NextResponse.json({
        success: true,
        sessionId,
        redis: {
          status: redisStatus,
          message: 'Redis ist nicht verfügbar - Duplikat-Prävention kann nicht geprüft werden',
        },
        booking: booking ? {
          found: true,
          customerEmail: booking.customer_email,
          customerName: booking.customer_name,
          packageType: booking.package_type,
          status: booking.status,
        } : {
          found: false,
        },
        emailConfig: {
          EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER ? '✅ gesetzt' : '❌ fehlt',
          EMAIL_SMTP_PASSWORD: process.env.EMAIL_SMTP_PASSWORD ? '✅ gesetzt' : '❌ fehlt',
        },
      });
    }
  } catch (error) {
    console.error('Fehler beim Debuggen des E-Mail-Status:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler', details: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    );
  }
}

