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

    // Prüfen ob Kunde bereits existiert
    let existingCustomer;
    try {
      existingCustomer = await getCustomerByEmail(email);
    } catch (dbError) {
      // Bei Datenbank-Fehler: Weiter mit Registrierung (kann sein, dass Tabelle noch nicht existiert)
      existingCustomer = null;
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

    // Kunde in Datenbank erstellen
    // Nach Registrierung: Kunde ist automatisch verifiziert und kann sich einloggen
    let customer;
    try {
      customer = await createCustomer({
        email,
        password_hash: passwordHash,
        name,
        phone: phone || null,
        company_name: companyName || null,
        is_verified: true, // Automatisch verifiziert nach Registrierung
        verification_token: verificationToken,
        portal_activated: true // Portal automatisch aktiviert
      });
    } catch (createError) {
      // Detaillierter Fehler für Debugging
      const errorMsg = createError instanceof Error ? createError.message : 'Unbekannter Fehler';
      const errorStack = createError instanceof Error ? createError.stack : undefined;
      console.error('❌ createCustomer Fehler:', {
        message: errorMsg,
        stack: errorStack,
        error: createError
      });
      
      // Wenn Tabelle nicht existiert, gebe hilfreiche Meldung
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation') || errorMsg.includes('table')) {
        return NextResponse.json(
          { success: false, error: 'Datenbank-Tabelle existiert nicht. Bitte kontaktieren Sie den Administrator.' },
          { status: 500 }
        );
      }
      
      // SSL/Datenbank-Verbindungsfehler
      if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || errorMsg.includes('unable to verify') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('timeout')) {
        return NextResponse.json(
          { success: false, error: 'Datenbank-Verbindungsfehler. Bitte versuchen Sie es später erneut.' },
          { status: 500 }
        );
      }
      
      throw createError; // Weiterwerfen für allgemeine Fehlerbehandlung
    }

    // Verifikations-E-Mail senden (optional, da bereits verifiziert)
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch {
      // E-Mail-Fehler ignorieren, Kunde ist bereits verifiziert
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
      message: 'Konto erfolgreich erstellt. Sie können sich jetzt anmelden.',
      user: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        is_verified: customer.is_verified
      },
      token
    });

  } catch (error) {
    // Detaillierte Fehlerbehandlung
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ Registrierung Fehler:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    // Datenbank-Fehler erkennen
    if (errorMessage.includes('certificate') || errorMessage.includes('SSL') || errorMessage.includes('TLS') || errorMessage.includes('unable to verify') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
      return NextResponse.json(
        { success: false, error: 'Datenbank-Verbindungsfehler. Bitte versuchen Sie es später erneut.' },
        { status: 500 }
      );
    }
    
    // Duplikat-Fehler erkennen
    if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      return NextResponse.json(
        { success: false, error: 'Ein Konto mit dieser E-Mail-Adresse existiert bereits' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}
