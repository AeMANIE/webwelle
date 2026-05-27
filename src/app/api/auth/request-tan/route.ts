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

    // E-Mail normalisieren (toLowerCase für konsistente Speicherung)
    const normalizedEmail = email.toLowerCase().trim();
    
    const result = await requestTAN(normalizedEmail, password);
    
    if (result.success) {
      const tan = (result as { tan?: string }).tan;
      
      // TAN im gemeinsamen Store speichern (Redis)
      if (tan) {
        await storeTAN(normalizedEmail, tan);
      }
      
      // TAN wird NICHT mehr in Response zurückgegeben (Sicherheit)
      // Nur in Entwicklung, wenn explizit gewünscht
      const response: { success: boolean; message: string; tan?: string } = { 
        success: true, 
        message: result.message
      };
      
      // Nur in Entwicklung: TAN zurückgeben (wenn NODE_ENV !== 'production')
      if (process.env.NODE_ENV !== 'production' && tan) {
        response.tan = tan;
      }
      
      return NextResponse.json(response);
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
