import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';
import { getRedisClient } from '@/lib/redis';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY nicht gesetzt');
  return new Stripe(key);
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
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
    const cacheKey = `admin:invoices:list:${startDate || 'all'}:${endDate || 'all'}:${statusFilter || 'all'}`;
    if (redis && (await redis.status) === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) return NextResponse.json(JSON.parse(cached));
    }

    const stripe = getStripe();
    const invoices = await stripe.invoices.list(stripeParams);

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

    // Status-Filter (client-side, da Stripe API keine direkte Status-Filterung unterstützt)
    if (statusFilter && statusFilter !== 'all') {
      formatted = formatted.filter(inv => inv.status === statusFilter);
    }

    if (redis && (await redis.status) === 'ready') {
      await redis.setex(cacheKey, 600, JSON.stringify(formatted));
    }

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Fehler beim Laden der Rechnungen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Rechnungen' }, { status: 500 });
  }
}


