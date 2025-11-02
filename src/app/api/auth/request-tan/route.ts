import { NextResponse } from 'next/server';
import { requestTAN } from '@/lib/auth';
import { storeTAN } from '@/lib/tan-store';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    const result = await requestTAN(email, password);
    
    if (result.success) {
      const tan = (result as { tan?: string }).tan;
      
      // TAN im gemeinsamen Store speichern (Redis)
      if (tan) {
        await storeTAN(email, tan);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: result.message,
        tan: tan // Für Entwicklung: TAN zurückgeben
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('TAN-Anfrage Fehler:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
