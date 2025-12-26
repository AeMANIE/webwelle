import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireAdminAuth, secureResponse, validateAPIInput } from '@/lib/api-security';
import { getRedisClient } from '@/lib/redis';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY nicht gesetzt');
  return new Stripe(key);
}

export async function GET(request: NextRequest) {
  try {
    // Admin-Auth mit Rate Limiting
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Rate limit oder Auth-Fehler
    }

    // Zeitfilter aus Query-Parameter
    const periodParam = request.nextUrl.searchParams.get('period') || '30days';
    
    // Input-Validierung für period Parameter
    const validation = validateAPIInput(
      { period: periodParam },
      { period: { type: 'string', required: false } }
    );
    
    if (!validation.isValid) {
      return secureResponse({ error: 'Ungültige Parameter', errors: validation.errors }, 400);
    }

    const period = periodParam;
    
    // Datum für Filter berechnen
    let createdAfter: number | undefined;
    const now = Math.floor(Date.now() / 1000);
    
    switch (period) {
      case '30days':
        createdAfter = now - (30 * 24 * 60 * 60); // 30 Tage
        break;
      case '3months':
        createdAfter = now - (90 * 24 * 60 * 60); // 3 Monate
        break;
      case '6months':
        createdAfter = now - (180 * 24 * 60 * 60); // 6 Monate
        break;
      case 'all':
        createdAfter = undefined; // Alle
        break;
      default:
        createdAfter = now - (30 * 24 * 60 * 60); // Standard: 30 Tage
    }

    // Hole Filter-Parameter
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');
    const statusFilter = request.nextUrl.searchParams.get('status');

    // Baue Stripe-Query-Parameter
    const stripeParams: Stripe.InvoiceListParams = {
      limit: 100,
      expand: ['data.customer', 'data.subscription'],
    };

    // Zeitraum-Filter
    if (startDate && endDate) {
      stripeParams.created = {
        gte: Math.floor(new Date(startDate).getTime() / 1000),
        lte: Math.floor(new Date(endDate).getTime() / 1000),
      };
    } else if (startDate) {
      stripeParams.created = Math.floor(new Date(startDate).getTime() / 1000);
    } else if (endDate) {
      stripeParams.created = Math.floor(new Date(endDate).getTime() / 1000);
    }

    const redis = getRedisClient();
    const cacheKey = `admin:invoices:list:${period}`;
    if (redis && redis.status === 'ready') {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return secureResponse(JSON.parse(cached));
      } catch (cacheError) {
        console.warn('⚠️ Redis Cache-Fehler (ignoriert):', cacheError);
      }
    }

    const stripe = getStripe();
    
    // Stripe API: created Parameter für Zeitfilter
    const listParams: Stripe.InvoiceListParams = {
      limit: 100,
      expand: ['data.customer', 'data.subscription']
    };
    
    if (createdAfter) {
      listParams.created = { gte: createdAfter };
    }
    
    const invoices = await stripe.invoices.list(listParams);

    const isStripeCustomer = (c: Stripe.Customer | Stripe.DeletedCustomer): c is Stripe.Customer => {
      return (c as Stripe.DeletedCustomer).deleted !== true;
    };

    let formatted = invoices.data.map(inv => {
      const cust = typeof inv.customer === 'object' && inv.customer ? inv.customer : null;
      const customerEmail = cust && isStripeCustomer(cust) ? cust.email ?? null : null;
      const customerName = cust && isStripeCustomer(cust) ? cust.name ?? null : null;

      return {
        id: inv.id,
        invoiceNumber: inv.number,
        customerEmail,
        customerName,
        amount: (inv.amount_paid ?? 0) / 100,
        currency: inv.currency?.toUpperCase(),
        status: inv.status,
        issuer: 'stripe',
        paidAt: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000).toISOString() : null,
        dueDate: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
        pdfUrl: inv.invoice_pdf,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        createdAt: new Date(inv.created * 1000).toISOString(),
      };
    });

    // Cache speichern (10 Minuten TTL)
    if (redis && redis.status === 'ready') {
      try {
        await redis.setex(cacheKey, 600, JSON.stringify(formatted));
      } catch (cacheError) {
        console.warn('⚠️ Redis Cache-Speicher-Fehler (ignoriert):', cacheError);
      }
    }

    return secureResponse(formatted);
  } catch (error) {
    console.error('Fehler beim Laden der Rechnungen:', error);
    return secureResponse({ error: 'Fehler beim Laden der Rechnungen' }, 500);
  }
}


