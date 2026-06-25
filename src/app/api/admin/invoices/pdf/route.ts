import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { generateBrandedInvoicePdf } from '@/lib/invoices/branded-pdf';
import { getInvoiceByRef } from '@/lib/invoices/resolve';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    const invoiceId = request.nextUrl.searchParams.get('id');
    if (!invoiceId) return secureResponse({ error: 'id erforderlich' }, 400);

    const pdf = await generateBrandedInvoicePdf(invoiceId);
    const invoice = await getInvoiceByRef(invoiceId);
    const fileName = `invoice-${invoice?.invoice_number || invoiceId}.pdf`;

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('PDF-Generierung fehlgeschlagen:', error);
    return secureResponse({ error: 'PDF-Generierung fehlgeschlagen' }, 500);
  }
}
