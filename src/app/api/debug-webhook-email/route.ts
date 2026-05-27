import { NextResponse } from 'next/server';

/**
 * Debug-Route um E-Mail-Konfiguration und Webhook-Status zu prüfen
 * WARNUNG: Diese Route sollte in Produktion deaktiviert oder geschützt werden
 */
export async function GET() {
  // Sicherheit: Nur in Development oder mit API-Key
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG_ROUTES) {
    return NextResponse.json({
      status: 'error',
      message: 'Debug-Route nur in Development verfügbar'
    }, { status: 403 });
  }

  const emailConfig = {
    EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER ? '✅ gesetzt' : '❌ fehlt',
    EMAIL_SMTP_PASSWORD: process.env.EMAIL_SMTP_PASSWORD ? '✅ gesetzt' : '❌ fehlt',
    EMAIL_SMTP_HOST: 'smtp.hostinger.com (fest im Code)',
    EMAIL_SMTP_PORT: '465 (fest im Code)',
    EMAIL_SMTP_SECURE: 'true / SSL/TLS (fest im Code)',
    EMAIL_FROM: process.env.EMAIL_FROM || 'info@webwelle.com (Standard)',
    info: 'Nur EMAIL_SMTP_USER und EMAIL_SMTP_PASSWORD müssen in .env.local gesetzt werden',
  };

  const webhookConfig = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ gesetzt' : '❌ fehlt',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? '✅ gesetzt' : '❌ fehlt',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000 (Standard)',
    webhookEndpoint: process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/webhook`
      : 'http://localhost:3000/api/stripe/webhook (Standard)',
  };

  const redisConfig = {
    REDIS_URL: process.env.REDIS_URL ? '✅ gesetzt' : '❌ fehlt',
  };

  return NextResponse.json({
    status: 'success',
    message: 'Debug-Informationen für E-Mail und Webhook',
    config: {
      email: emailConfig,
      webhook: webhookConfig,
      redis: redisConfig,
    },
    recommendations: [
      emailConfig.EMAIL_SMTP_USER === '❌ fehlt' || emailConfig.EMAIL_SMTP_PASSWORD === '❌ fehlt'
        ? '⚠️ E-Mail-Konfiguration fehlt! E-Mails werden nur in der Konsole ausgegeben.'
        : '✅ E-Mail-Konfiguration vorhanden',
      webhookConfig.STRIPE_WEBHOOK_SECRET === '❌ fehlt'
        ? '⚠️ STRIPE_WEBHOOK_SECRET fehlt! Webhooks funktionieren nicht korrekt.'
        : '✅ Webhook-Secret vorhanden',
      'Stelle sicher, dass der Webhook-Endpunkt in Stripe Dashboard konfiguriert ist: ' + webhookConfig.webhookEndpoint,
    ],
  });
}

