import { NextResponse } from 'next/server';
import { validateResetToken, markResetTokenAsUsed, getCustomerByEmail, updateCustomer } from '@/lib/database';
import { hashPassword, validatePassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();
    
    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token und neues Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    // Token validieren
    const resetTokenData = await validateResetToken(token);
    if (!resetTokenData) {
      return NextResponse.json(
        { success: false, error: 'Ungültiger oder abgelaufener Reset-Token' },
        { status: 400 }
      );
    }

    // Passwort-Stärke prüfen
    const passwordValidation = validatePassword(newPassword);
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

    // Kunde finden
    const customer = await getCustomerByEmail(resetTokenData.email);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Kunde nicht gefunden' },
        { status: 404 }
      );
    }

    // Neues Passwort hashen
    const newPasswordHash = await hashPassword(newPassword);

    // Passwort in Datenbank aktualisieren
    await updateCustomer(customer.id!, {
      password_hash: newPasswordHash
    });

    // Token als verwendet markieren
    await markResetTokenAsUsed(token);

    return NextResponse.json({
      success: true,
      message: 'Passwort erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.'
    });

  } catch (error) {
    console.error('Passwort-Reset-Bestätigung-Fehler:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
