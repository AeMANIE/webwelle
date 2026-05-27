import { NextResponse } from 'next/server';
import { directus, isDirectusAvailable } from '@/lib/directus';

export async function GET() {
  try {
    // Prüfe ob Directus verfügbar ist
    if (!isDirectusAvailable()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Directus nicht verfügbar',
        config: {
          url: process.env.DIRECTUS_URL,
          token: process.env.DIRECTUS_TOKEN ? '***' : 'nicht gesetzt'
        }
      }, { status: 503 });
    }

    // Teste Directus-Verbindung
    try {
      // Versuche eine einfache Abfrage
      const result = await directus.request<{ data: Array<Record<string, unknown>> }>('webwelle_bookings?limit=1');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Directus-Verbindung erfolgreich',
        config: {
          url: process.env.DIRECTUS_URL,
          token: process.env.DIRECTUS_TOKEN ? '***' : 'nicht gesetzt'
        },
        test: {
          connection: true,
          collections: 'webwelle_bookings erreichbar',
          sampleData: result.data.length > 0 ? 'Daten vorhanden' : 'Keine Daten'
        }
      });

    } catch (directusError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Directus-Verbindung fehlgeschlagen',
        error: directusError instanceof Error ? directusError.message : 'Unbekannter Fehler',
        config: {
          url: process.env.DIRECTUS_URL,
          token: process.env.DIRECTUS_TOKEN ? '***' : 'nicht gesetzt'
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Directus-Konfiguration Test Fehler:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      config: {
        url: process.env.DIRECTUS_URL,
        token: process.env.DIRECTUS_TOKEN ? '***' : 'nicht gesetzt'
      }
    }, { status: 500 });
  }
}
