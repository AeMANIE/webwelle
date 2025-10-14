import { NextResponse } from 'next/server';
import { saveBooking } from '@/lib/database';

export async function POST() {
  try {
    // Test-Buchung erstellen
    const testBooking = {
      session_id: 'cs_test_' + Date.now(),
      package_type: 'starterwelle' as const,
      is_monthly: false,
      customer_name: 'Test Kunde',
      customer_email: 'test@example.com',
      customer_phone: '+49 123 456789',
      company_name: 'Test Unternehmen GmbH',
      existing_website: 'nein',
      target_group: ['Unternehmen', 'Startups'],
      design_style: 'modern',
      functions: ['CMS', 'E-Commerce'],
      budget: '2000-3000',
      message: 'Test-Buchung über API',
      stripe_customer_id: 'cus_test_' + Date.now(),
      stripe_payment_intent_id: 'pi_test_' + Date.now(),
      status: 'paid' as const
    };

    const savedBooking = await saveBooking(testBooking);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test-Buchung erfolgreich erstellt',
      booking: savedBooking
    });
  } catch (error) {
    console.error('Test-Webhook-Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Test-Buchung', details: error },
      { status: 500 }
    );
  }
}
