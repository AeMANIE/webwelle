import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse, validateAPIInput } from '@/lib/api-security';
import { getRedisClient } from '@/lib/redis';
import { listInvoicesForAdmin, type AdminInvoicePeriod } from '@/lib/invoices/resolve';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const periodParam = request.nextUrl.searchParams.get('period') || 'all';
    const statusParam = request.nextUrl.searchParams.get('status') || 'all';
    const customerId = request.nextUrl.searchParams.get('customerId');

    const validation = validateAPIInput(
      { period: periodParam, status: statusParam },
      { period: { type: 'string', required: false }, status: { type: 'string', required: false } }
    );

    if (!validation.isValid) {
      return secureResponse({ error: 'Ungültige Parameter', errors: validation.errors }, 400);
    }

    const period = periodParam as AdminInvoicePeriod;
    const cacheKey = `admin:invoices:v2:${period}:${statusParam}:${customerId || 'all'}`;

    const redis = getRedisClient();
    if (redis && redis.status === 'ready') {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return secureResponse(JSON.parse(cached));
      } catch (cacheError) {
        console.warn('Redis Cache-Fehler (ignoriert):', cacheError);
      }
    }

    const rows = await listInvoicesForAdmin({
      period,
      status: statusParam,
      customerId,
    });

    const formatted = rows.map((inv) => ({
      id: inv.stripeInvoiceId.startsWith('in_') ? inv.stripeInvoiceId : inv.id,
      dbId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerEmail: inv.customerEmail,
      customerName: inv.customerName,
      customerNumber: inv.customerNumber,
      amount: inv.amount,
      currency: inv.currency,
      status: inv.status,
      issuer: inv.issuer,
      paidAt: inv.paidAt,
      dueDate: inv.dueDate,
      pdfUrl: inv.pdfUrl,
      hostedInvoiceUrl: inv.hostedInvoiceUrl,
      createdAt: inv.createdAt,
      bookingId: inv.bookingId,
    }));

    if (redis && redis.status === 'ready') {
      try {
        await redis.setex(cacheKey, 600, JSON.stringify(formatted));
      } catch (cacheError) {
        console.warn('Redis Cache-Speicher-Fehler (ignoriert):', cacheError);
      }
    }

    return secureResponse(formatted);
  } catch (error) {
    console.error('Fehler beim Laden der Rechnungen:', error);
    return secureResponse({ error: 'Fehler beim Laden der Rechnungen' }, 500);
  }
}
