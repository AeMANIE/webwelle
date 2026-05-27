import { NextResponse } from 'next/server';
import { getCustomerByEmail, createResetToken } from '@/lib/database';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'E-Mail ist erforderlich' },
        { status: 400 }
      );
    }

    // Kunde finden
    const customer = await getCustomerByEmail(email);
    if (!customer) {
      // Aus Sicherheitsgründen immer "Erfolg" zurückgeben
      return NextResponse.json({
        success: true,
        message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Passwort-Reset-Link gesendet.'
      });
    }

    // Reset-Token generieren
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15) +
                      Math.random().toString(36).substring(2, 15);

    // Token in Datenbank speichern (1 Stunde gültig)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await createResetToken(email, resetToken, expiresAt);

    // Reset-E-Mail senden
    try {
      await sendPasswordResetEmail(email, customer.name, resetToken);
    } catch (emailError) {
      console.error('Fehler beim Senden der Reset-E-Mail:', emailError);
      return NextResponse.json(
        { success: false, error: 'Fehler beim Senden der E-Mail' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Passwort-Reset-Link wurde an Ihre E-Mail-Adresse gesendet.'
    });

  } catch (error) {
    console.error('Passwort-Reset-Fehler:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
