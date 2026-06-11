import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAdminAuth } from '@/lib/api-security';
import { generateInvoicePdf } from '@/lib/invoice-pdf';
import { getCustomerByEmail } from '@/lib/database';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY nicht gesetzt');
  return new Stripe(key);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    const invoiceId = request.nextUrl.searchParams.get('id');
    if (!invoiceId) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 });

    const stripe = getStripe();
    const inv = await stripe.invoices.retrieve(invoiceId, { expand: ['customer', 'lines.data.price.product'] });

    let customerName: string | null = null;
    let customerEmail: string | null = null;
    if (typeof inv.customer === 'object' && inv.customer && 'deleted' in inv.customer) {
      if (!(inv.customer as Stripe.DeletedCustomer).deleted) {
        const c = inv.customer as Stripe.Customer;
        customerName = c.name ?? null;
        customerEmail = c.email ?? null;
      }
    } else if (typeof inv.customer === 'object' && inv.customer) {
      const c = inv.customer as Stripe.Customer;
      customerName = c.name ?? null;
      customerEmail = c.email ?? null;
    }
    
    // Kundennummer abrufen
    let customerNumber: string | null = null;
    if (customerEmail) {
      const dbCustomer = await getCustomerByEmail(customerEmail);
      customerNumber = dbCustomer?.customer_number || null;
    }

    // Items
    const items = (inv.lines.data || []).map((l) => {
      const desc = l.description || 'Position';
      const quantity = l.quantity ?? 1;
      const netAmount = ((l.amount ?? 0) / 100) / quantity;
      const planInterval = (l as unknown as { plan?: { interval?: 'day'|'week'|'month'|'year' } }).plan?.interval;
      const interval = planInterval === 'year' ? 'yearly' : planInterval === 'month' ? 'monthly' : 'oneTime';
      return { description: desc, quantity, netAmount, interval } as const;
    });

    const pdf = await generateInvoicePdf({
      invoiceNumber: String(inv.number || inv.id),
      issueDate: new Date(((inv.created ?? Math.floor(Date.now() / 1000)) as number) * 1000),
      customer: { name: customerName || customerEmail || '', email: customerEmail || '' },
      items,
      banking: {
        companyName: 'AeManie GmbH',
        addressLine: 'Uhlandstr.16 – 87437 Kempten',
        iban: 'DE25 7335 0000 05163187 06',
        bic: 'BYLADEM1ALG',
        taxOffice: 'Finanzamt Kempten',
        taxNumber: '127 121 20418',
        vatId: 'DE 367002188',
      },
      notes: customerNumber ? `Kundennummer: ${customerNumber}` : 'Alle Preise netto zzgl. 19% MwSt. Vielen Dank für Ihr Vertrauen!',
    });

    const body = new Uint8Array(pdf);
    return new Response(body as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${inv.number || inv.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF-Generierung fehlgeschlagen:', error);
    return NextResponse.json({ error: 'PDF-Generierung fehlgeschlagen' }, { status: 500 });
  }
}


