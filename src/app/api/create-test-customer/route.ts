import { NextResponse } from 'next/server';
import { createCustomer, getCustomerByEmail } from '@/lib/database';
import { hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Route nicht verfügbar' }, { status: 404 });
  }

  try {
    const { email, password, name } = await request.json();
    
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'E-Mail, Passwort und Name sind erforderlich' },
        { status: 400 }
      );
    }

    // Prüfen ob Kunde bereits existiert
    const existingCustomer = await getCustomerByEmail(email);
    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Kunde existiert bereits' },
        { status: 409 }
      );
    }

    // Passwort hashen
    const passwordHash = await hashPassword(password);

    // Kunde erstellen
    const customer = await createCustomer({
      email,
      password_hash: passwordHash,
      name,
      is_verified: true
    });

    return NextResponse.json({
      success: true,
      message: 'Test-Kunde erfolgreich erstellt',
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name
      }
    });

  } catch (error) {
    console.error('Test-Kunde erstellen Fehler:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
