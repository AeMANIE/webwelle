import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { requireAdminAuth } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Hole Filter-Parameter
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');
    const statusFilter = request.nextUrl.searchParams.get('status');
    const packageTypeFilter = request.nextUrl.searchParams.get('packageType');

    let client;
    let tempPool: import('pg').Pool | null = null;

    try {
      client = await pool.connect();
    } catch (connectionError) {
      const errorMsg = connectionError instanceof Error ? connectionError.message : '';
      if (errorMsg.includes('certificate') || errorMsg.includes('SSL') || errorMsg.includes('TLS') || 
          errorMsg.includes('unable to verify') || errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo')) {
        const { Pool: TempPool } = await import('pg');
        // Versuche mit öffentlicher URL falls DATABASE_PUBLICURL gesetzt ist
        const dbUrl = process.env.DATABASE_PUBLICURL || process.env.DATABASE_URL;
        tempPool = new TempPool({
          connectionString: dbUrl,
          ssl: dbUrl?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 10000,
        });
        client = await tempPool.connect();
      } else {
        throw connectionError;
      }
    }

    try {
      // Baue Query mit Filtern
      let query = `
        SELECT 
          b.*,
          c.name as customer_name_full,
          c.email as customer_email_full,
          c.customer_number,
          c.phone as customer_phone_full
        FROM webwelle_bookings b
        LEFT JOIN customers c ON (b.customer_id = c.id OR b.customer_email = c.email)
        WHERE 1=1
      `;
      const params: unknown[] = [];
      let paramCount = 1;

      // Zeitraum-Filter
      if (startDate) {
        query += ` AND b.created_at >= $${paramCount}`;
        params.push(startDate);
        paramCount++;
      }
      if (endDate) {
        query += ` AND b.created_at <= $${paramCount}`;
        params.push(endDate);
        paramCount++;
      }

      // Status-Filter
      if (statusFilter && statusFilter !== 'all') {
        query += ` AND b.status = $${paramCount}`;
        params.push(statusFilter);
        paramCount++;
      }

      // Package-Type-Filter
      if (packageTypeFilter && packageTypeFilter !== 'all') {
        query += ` AND b.package_type = $${paramCount}`;
        params.push(packageTypeFilter);
        paramCount++;
      }

      query += ` ORDER BY b.created_at DESC`;

      const result = await client.query(query, params);

      const bookings = result.rows.map(row => ({
        id: row.id,
        sessionId: row.session_id,
        packageType: row.package_type,
        packageName: getPackageName(row.package_type),
        isMonthly: row.is_monthly,
        checkoutMode: row.checkout_mode,
        packagePriceDisplay: row.package_price_display,
        currency: row.currency || 'EUR',
        totalAmountCents: row.total_amount_cents,
        totalAmount: (row.total_amount_cents / 100).toFixed(2),
        customerId: row.customer_id,
        customerName: row.customer_name || row.customer_name_full,
        customerEmail: row.customer_email || row.customer_email_full,
        customerPhone: row.customer_phone || row.customer_phone_full,
        customerNumber: row.customer_number,
        companyName: row.company_name,
        status: row.status,
        createdAt: row.created_at,
        stripeCustomerId: row.stripe_customer_id,
        stripePaymentIntentId: row.stripe_payment_intent_id,
        stripeSubscriptionId: row.stripe_subscription_id,
        selectedAddons: row.selected_addons,
        designStyle: row.design_style,
        message: row.message,
      }));

      return NextResponse.json(bookings);
    } finally {
      if (client) client.release();
      if (tempPool) await tempPool.end();
    }
  } catch (error) {
    console.error('Fehler beim Laden der Buchungen:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Buchungen' },
      { status: 500 }
    );
  }
}

function getPackageName(packageType: string): string {
  const names: Record<string, string> = {
    starterwelle: 'StarterWelle',
    businesswelle: 'BusinessWelle',
    erfolgswelle: 'ErfolgsWelle',
    flowwelle: 'FlowWelle',
    powerwelle: 'PowerWelle',
    meisterwelle: 'MeisterWelle',
    minijob: 'Mini Job AI-Assistent',
    midijob: 'Midi Job AI-Assistenz',
    festangestellt: 'Festangestellt AI-Agent',
    einrichtungspaket: 'Einrichtungspaket AI Voice',
  };
  return names[packageType] || packageType;
}

