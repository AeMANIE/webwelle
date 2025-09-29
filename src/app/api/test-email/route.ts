import { NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'E-Mail-Adresse ist erforderlich' },
        { status: 400 }
      );
    }

    const success = await sendTestEmail(email);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test-E-Mail erfolgreich gesendet' 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Fehler beim Senden der E-Mail' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test-E-Mail Fehler:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}