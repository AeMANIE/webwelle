import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth, secureResponse } from '@/lib/api-security';
import { assertCustomerOwnsInvoice } from '@/lib/invoices/ownership';
import { generateBrandedInvoicePdf } from '@/lib/invoices/branded-pdf';
import { getInvoiceByRef } from '@/lib/invoices/resolve';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCustomerAuth(request);
    if (auth instanceof NextResponse) return auth;

    const invoiceRef = request.nextUrl.searchParams.get('id');
    if (!invoiceRef) {
      return secureResponse({ error: 'Rechnungs-ID ist erforderlich' }, 400);
    }

    const customerId = auth.user.customerId;
    if (!customerId) {
      return secureResponse({ error: 'Kundenkontext fehlt' }, 403);
    }

    const owned = await assertCustomerOwnsInvoice(invoiceRef, customerId, auth.user.email);
    if (!owned) {
      return secureResponse({ error: 'Nicht autorisiert' }, 403);
    }

    const pdf = await generateBrandedInvoicePdf(invoiceRef);
    const invoice = await getInvoiceByRef(invoiceRef);
    const fileName = `Rechnung_${invoice?.invoice_number || invoiceRef}.pdf`;

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Kunden-Rechnungs-PDF Fehler:', error);
    return secureResponse({ error: 'PDF konnte nicht erstellt werden' }, 500);
  }
}
