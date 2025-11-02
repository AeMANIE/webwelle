import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmation } from '@/lib/email-confirmation';
import { getBookingBySessionId } from '@/lib/database';
import { getPackageDisplayName, extractAddonsFromMetadata } from '@/lib/email-helpers';

/**
 * Manuelle Route zum Senden einer Bestellbestätigungs-E-Mail
 * Nützlich, wenn der Webhook nicht funktioniert hat
 * 
 * WARNUNG: Diese Route sollte in Produktion geschützt werden!
 */
export async function POST(request: NextRequest) {
  // Sicherheit: Nur in Development oder mit API-Key
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG_ROUTES) {
    return NextResponse.json({
      success: false,
      error: 'Route nur in Development verfügbar'
    }, { status: 403 });
  }

  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Buchung aus Datenbank laden
    const booking = await getBookingBySessionId(sessionId);
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Buchung nicht gefunden' },
        { status: 404 }
      );
    }

    if (!booking.customer_email) {
      return NextResponse.json(
        { success: false, error: 'Keine E-Mail-Adresse für diese Buchung gefunden' },
        { status: 400 }
      );
    }

    // Metadata aus raw_form_data extrahieren (falls vorhanden)
    const metadata = booking.stripe_metadata || {};
    const packageCategory = metadata && typeof metadata === 'object' && 'packageCategory' in metadata
      ? (typeof metadata.packageCategory === 'string' ? metadata.packageCategory : undefined)
      : undefined;
    
    const packageName = getPackageDisplayName(
      booking.package_type || '',
      packageCategory
    );

    // Add-ons extrahieren
    let selectedAddons: Array<{ label: string; price: string; billing: 'oneTime' | 'monthly' | 'yearly' }> = [];
    
    if (booking.selected_addons && Array.isArray(booking.selected_addons)) {
      selectedAddons = booking.selected_addons.map((addon) => {
        // Type guard für die Struktur
        const addonObj = addon as { key?: string; billing?: 'oneTime' | 'monthly' | 'yearly' | 'yearly'; amountCents?: number; label?: unknown; name?: unknown; amount?: unknown };
        
        // Versuche Label/Name zu finden
        const label = 
          addonObj.label && typeof addonObj.label === 'string' ? addonObj.label :
          addonObj.name && typeof addonObj.name === 'string' ? addonObj.name :
          addonObj.key && typeof addonObj.key === 'string' ? addonObj.key :
          'Zusatzoption';
        
        // Versuche Preis zu finden
        const priceCents = 
          typeof addonObj.amountCents === 'number' ? addonObj.amountCents :
          typeof addonObj.amount === 'number' ? addonObj.amount :
          0;
        
        const price = priceCents > 0 ? `${(priceCents / 100).toFixed(2)} €` : '0 €';
        
        // Billing-Typ
        const billing: 'oneTime' | 'monthly' | 'yearly' = 
          addonObj.billing === 'yearly' ? 'yearly' :
          addonObj.billing === 'monthly' ? 'monthly' :
          'oneTime';
        
        return { label, price, billing };
      });
    }

    // E-Mail senden
    const emailResult = await sendBookingConfirmation({
      customerName: booking.customer_name || booking.customer_email.split('@')[0],
      customerEmail: booking.customer_email,
      packageName: packageName,
      packagePrice: booking.package_price_display || `${(booking.total_amount_cents || 0) / 100} €`,
      isMonthly: booking.is_monthly || false,
      selectedAddons: selectedAddons,
      totalAmount: (booking.total_amount_cents || 0) / 100,
      currency: booking.currency || 'eur',
      sessionId: booking.session_id || sessionId,
    });

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: `Bestellbestätigung erfolgreich gesendet an ${booking.customer_email}`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: emailResult.error || 'Fehler beim Senden der E-Mail',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Fehler beim manuellen Senden der E-Mail:', error);
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

