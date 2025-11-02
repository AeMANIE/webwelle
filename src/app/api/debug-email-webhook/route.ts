import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

/**
 * Debug-Route um E-Mail-Konfiguration und Webhook-Status zu prüfen
 */
export async function GET() {
  // Sicherheit: Nur in Development oder mit Flag
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG_ROUTES) {
    return NextResponse.json({
      status: 'error',
      message: 'Debug-Route nur in Development verfügbar'
    }, { status: 403 });
  }

  try {
    // E-Mail-Konfiguration prüfen
    const emailConfig = {
      EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER ? '✅ gesetzt' : '❌ fehlt',
      EMAIL_SMTP_PASSWORD: process.env.EMAIL_SMTP_PASSWORD ? '✅ gesetzt' : '❌ fehlt',
      EMAIL_FROM: process.env.EMAIL_FROM || 'info@webwelle.com (Standard)',
      EMAIL_SMTP_HOST: 'smtp.hostinger.com (fest im Code)',
      EMAIL_SMTP_PORT: '465 (fest im Code)',
      EMAIL_SMTP_SECURE: 'true (fest im Code)',
    };

    // Redis Status prüfen
    const redis = getRedisClient();
    let redisStatus = 'Nicht aktiviert';
    if (redis) {
      const status = await redis.status;
      redisStatus = status === 'ready' ? '✅ Verbunden' : `⚠️ ${status}`;
    }

    // Webhook-Konfiguration prüfen
    const webhookConfig = {
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? '✅ gesetzt' : '❌ fehlt',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ gesetzt' : '❌ fehlt',
    };

    return NextResponse.json({
      status: 'success',
      email: emailConfig,
      redis: redisStatus,
      webhook: webhookConfig,
      environment: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'Nicht gesetzt',
      hints: {
        testEmail: 'POST /api/test-booking-email mit { customerEmail: "harmonie_556@yahoo.com" }',
        testSMTP: 'GET /api/test-smtp-connection',
        manualSend: 'POST /api/manual-send-booking-email mit { sessionId: "..." }',
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Fehler beim Prüfen der Konfiguration',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
}

