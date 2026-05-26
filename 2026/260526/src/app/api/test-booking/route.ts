import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Test-Buchung erstellen
    const testBooking = {
      id: 1,
      session_id: 'test_session_123',
      package_type: 'nextjs',
      is_monthly: false,
      company_name: 'Test Unternehmen',
      customer_name: 'Max Mustermann',
      customer_email: 'test@example.com',
      customer_phone: '+49 123 456789',
      project_description: 'Test-Projekt für WebWelle',
      budget_range: '2000-3000',
      timeline: '3-6 Monate',
      additional_requirements: 'Keine besonderen Anforderungen',
      status: 'paid',
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Test-Buchung erstellt',
      booking: testBooking
    });

  } catch (error) {
    console.error('Fehler beim Erstellen der Test-Buchung:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Test-Buchung' },
      { status: 500 }
    );
  }
}
