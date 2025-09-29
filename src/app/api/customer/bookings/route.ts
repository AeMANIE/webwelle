import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // JWT-Token aus Cookie extrahieren
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Token validieren (vereinfacht)
    try {
      JSON.parse(atob(token.split('.')[1]));
      // userEmail = payload.email; // Wird später für Datenbankabfrage verwendet
    } catch {
      return NextResponse.json(
        { error: 'Ungültiger Token' },
        { status: 401 }
      );
    }

    // Für Entwicklung: Leere Buchungen zurückgeben, da keine echten Buchungen vorhanden
    // In Produktion würde hier die Datenbank abgefragt werden
    const customerBookings: Array<{
      id: number;
      session_id: string;
      package_type: string;
      is_monthly: boolean;
      company_name: string;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      project_description: string;
      budget_range: string;
      timeline: string;
      additional_requirements: string;
      status: string;
      created_at: string;
    }> = [];
    
    return NextResponse.json(customerBookings);

  } catch (error) {
    console.error('Fehler beim Laden der Kunden-Buchungen:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Buchungen' },
      { status: 500 }
    );
  }
}
