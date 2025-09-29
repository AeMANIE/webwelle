import { NextResponse } from 'next/server';
import { validatePassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Passwort ist erforderlich' },
        { status: 400 }
      );
    }

    const validation = validatePassword(password);
    
    return NextResponse.json({
      success: true,
      isValid: validation.isValid,
      feedback: validation.feedback,
      suggestions: validation.suggestions
    });

  } catch (error) {
    console.error('Passwort-Validierung Fehler:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
