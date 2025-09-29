import { NextRequest, NextResponse } from 'next/server';
import { saveBooking, BookingData } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const bookingData: BookingData = await request.json();
    
    // Validierung der Pflichtfelder
    if (!bookingData.session_id || !bookingData.customer_name || !bookingData.customer_email) {
      return NextResponse.json(
        { error: 'Session ID, Kundenname und E-Mail sind erforderlich' },
        { status: 400 }
      );
    }
    
    // Buchung in Datenbank speichern
    const savedBooking = await saveBooking(bookingData);
    
    return NextResponse.json({ 
      success: true, 
      booking: savedBooking 
    });
    
  } catch (error) {
    console.error('Fehler beim Speichern der Buchung:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Buchung' },
      { status: 500 }
    );
  }
}
