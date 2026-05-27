import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'API funktioniert',
    timestamp: new Date().toISOString(),
    env: {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    }
  });
}
