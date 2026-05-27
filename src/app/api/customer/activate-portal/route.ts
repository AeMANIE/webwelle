import { NextRequest, NextResponse } from 'next/server';
import { validateActivationToken, markTokenAsUsed } from '@/lib/portal-activation';
import { createToken } from '@/lib/auth';
import { pool, getCustomerByEmail, updateCustomer, createCustomer, ensureCustomerPortalColumns } from '@/lib/database';
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
    
    const { token, password, vatId } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token ist erforderlich' },
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
    
    await ensureCustomerPortalColumns();
    const passwordValue = String(password || '');
    
    // Kunde finden oder erstellen
    let customer = await getCustomerByEmail(tokenValidation.email!);
    const isActiveExistingCustomer =
      Boolean(customer?.password_hash && customer?.portal_activated) ||
      tokenValidation.purpose === 'existing_customer_link';
    const passwordRequired = !isActiveExistingCustomer;

    if (passwordRequired && !passwordValue) {
      return NextResponse.json(
        { success: false, error: 'Passwort ist erforderlich' },
        { status: 400 }
      );
    }

    let passwordHash: string | undefined;
    if (passwordValue) {
      const passwordValidation = await validatePassword(passwordValue);
      if (!passwordValidation.isValid) {
        return NextResponse.json(
          { success: false, error: passwordValidation.feedback.join(', ') || 'Passwort erfüllt nicht die Anforderungen' },
          { status: 400 }
        );
      }
      passwordHash = await import('@/lib/password').then(mod => mod.hashPassword(passwordValue));
    }
    
    if (!customer) {
      // Neuen Kunden erstellen
      customer = await createCustomer({
        email: tokenValidation.email!,
        password_hash: passwordHash || undefined,
        name: tokenValidation.customerName || tokenValidation.email!.split('@')[0],
        company_name: tokenValidation.companyName,
        vat_id: String(vatId || '').trim() || undefined,
        is_verified: true,
        portal_activated: true,
        portal_activated_at: new Date(),
      });
      if (String(vatId || '').trim()) {
        customer = await updateCustomer(tokenValidation.email!, {
          vat_id: String(vatId || '').trim(),
        }) || customer;
      }
    } else {
      // Bestehenden Kunden aktualisieren
      customer = await updateCustomer(tokenValidation.email!, {
        ...(passwordHash ? { password_hash: passwordHash } : {}),
        vat_id: String(vatId || '').trim() || customer.vat_id || undefined,
        is_verified: true,
        portal_activated: true,
        portal_activated_at: new Date(),
      });
    }

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Kunde konnte nicht aktiviert werden' },
        { status: 500 }
      );
    }

    if (tokenValidation.leadId && customer.id) {
      const client = await pool.connect();
      try {
        await client.query(
          `UPDATE funnel_leads
           SET customer_id = $1, updated_at = NOW()
           WHERE id = $2 OR LOWER(email) = LOWER($3)`,
          [customer.id, tokenValidation.leadId, tokenValidation.email]
        );
      } finally {
        client.release();
      }
    }
    
    // Token als verwendet markieren
    await markTokenAsUsed(token);

    if (!passwordHash && isActiveExistingCustomer) {
      return NextResponse.json({
        success: true,
        message: 'Analyse wurde mit Ihrem bestehenden Portal verbunden',
        redirectTo: '/customer/login?redirectTo=%2Fcustomer%3Ftab%3Danalysis',
      });
    }
    
    const jwt = createToken({
      id: String(customer.id),
      email: customer.email,
      role: 'customer',
      name: customer.name || customer.email,
    });

    const response = NextResponse.json({ 
      success: true,
      message: 'Portal erfolgreich aktiviert',
      redirectTo: '/customer?tab=analysis',
    });

    response.cookies.set('auth-token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Fehler bei Portal-Aktivierung:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler bei Portal-Aktivierung' },
      { status: 500 }
    );
  }
}

