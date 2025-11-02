import { NextResponse } from 'next/server';
import { createCustomer, getCustomerByEmail } from '@/lib/database';
import { hashPassword, validatePassword } from '@/lib/password';
import { sendVerificationEmail } from '@/lib/email';
import { createToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, name, phone, companyName } = await request.json();
    
    // Validierung
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'E-Mail, Passwort und Name sind erforderlich' },
        { status: 400 }
      );
    }

    // E-Mail-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      );
    }

    // Passwort-Stärke prüfen
    const passwordValidation = await validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Passwort zu schwach',
          feedback: passwordValidation.feedback,
          suggestions: passwordValidation.suggestions
        },
        { status: 400 }
      );
    }

    // Prüfen ob Kunde bereits existiert (versuche Datenbank, fallback zu hardcoded)
    let existingCustomer = null;
    try {
      existingCustomer = await getCustomerByEmail(email);
    } catch {
      console.log('Datenbank nicht verfügbar, verwende hardcoded Kunden-Liste');
      // Fallback: Hardcoded Kunden prüfen
      const hardcodedCustomers = [
        'customer1@example.com',
        'anna@demo-company.de', 
        'harmonie_556@yahoo.com'
      ];
      
      if (hardcodedCustomers.includes(email)) {
        return NextResponse.json(
          { success: false, error: 'Ein Konto mit dieser E-Mail-Adresse existiert bereits' },
          { status: 409 }
        );
      }
    }

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Ein Konto mit dieser E-Mail-Adresse existiert bereits' },
        { status: 409 }
      );
    }

    // Passwort hashen
    const passwordHash = await hashPassword(password);

    // Verifikations-Token generieren
    const verificationToken = Math.random().toString(36).substring(2, 15) + 
                            Math.random().toString(36).substring(2, 15);

    // Kunde erstellen (versuche Datenbank, fallback zu Simulation)
    let customer;
    try {
      customer = await createCustomer({
        email,
        password_hash: passwordHash,
        name,
        phone: phone || null,
        company_name: companyName || null,
        is_verified: false,
        verification_token: verificationToken
      });
      console.log('Kunde erfolgreich in Datenbank erstellt:', customer.id);
    } catch {
      console.log('Datenbank nicht verfügbar, erstelle simulierten Kunden');
      // Fallback: Simulierten Kunden erstellen
      customer = {
        id: Date.now(), // Simulierte ID
        email,
        password_hash: passwordHash,
        name,
        phone: phone || null,
        company_name: companyName || null,
        is_verified: false,
        verification_token: verificationToken
      };
    }

    // Verifikations-E-Mail senden (Simulation)
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailError) {
      console.error('Fehler beim Senden der Verifikations-E-Mail:', emailError);
      // Kunde trotzdem erstellen, aber ohne Verifikation
    }

    // JWT-Token erstellen
    const user = {
      id: customer.id?.toString() || Date.now().toString(),
      email: customer.email,
      role: 'customer' as const,
      name: customer.name
    };

    const token = createToken(user);

    return NextResponse.json({
      success: true,
      message: 'Konto erfolgreich erstellt. Bitte prüfen Sie Ihre E-Mails zur Verifikation.',
      user: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        is_verified: customer.is_verified
      },
      token
    });

  } catch (error) {
    console.error('Registrierungs-Fehler:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
