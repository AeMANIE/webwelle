import { NextRequest, NextResponse } from 'next/server';
import { validateActivationToken, markTokenAsUsed } from '@/lib/portal-activation';
import { hashPassword } from '@/lib/password';
import { getCustomerByEmail, updateCustomer, createCustomer } from '@/lib/database';
import { validatePassword } from '@/lib/password';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitCheck = rateLimit(RATE_LIMITS.LOGIN); // 5 Versuche pro 15 Minuten
    const rateLimitResult = await rateLimitCheck(ip);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Zu viele Versuche. Bitte versuchen Sie es später erneut.' },
        { status: 429 }
      );
    }
    
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token und Passwort sind erforderlich' },
        { status: 400 }
      );
    }
    
    // Token validieren
    const tokenValidation = await validateActivationToken(token);
    if (!tokenValidation.valid) {
      return NextResponse.json(
        { success: false, error: tokenValidation.error || 'Token ungültig' },
        { status: 400 }
      );
    }
    
    // Passwort validieren
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.feedback.join(', ') || 'Passwort erfüllt nicht die Anforderungen' },
        { status: 400 }
      );
    }
    
    // Passwort hashen
    const passwordHash = await hashPassword(password);
    
    // Kunde finden oder erstellen
    let customer = await getCustomerByEmail(tokenValidation.email!);
    
    if (!customer) {
      // Neuen Kunden erstellen
      customer = await createCustomer({
        email: tokenValidation.email!,
        password_hash: passwordHash,
        name: tokenValidation.email!.split('@')[0],
        is_verified: true,
        portal_activated: true,
      });
    } else {
      // Bestehenden Kunden aktualisieren
      customer = await updateCustomer(tokenValidation.email!, {
        password_hash: passwordHash,
        portal_activated: true,
        portal_activated_at: new Date(),
      });
    }
    
    // Token als verwendet markieren
    await markTokenAsUsed(token);
    
    return NextResponse.json({ 
      success: true,
      message: 'Portal erfolgreich aktiviert'
    });
  } catch (error) {
    console.error('Fehler bei Portal-Aktivierung:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler bei Portal-Aktivierung' },
      { status: 500 }
    );
  }
}

