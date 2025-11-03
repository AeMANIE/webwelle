import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getRedisClient } from '@/lib/redis';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const customerId = request.nextUrl.searchParams.get('id');
    if (customerId) {
      const detail = await getCustomerDetails(customerId);
      return NextResponse.json(detail);
    }

    const redis = getRedisClient();
    const cacheKey = 'admin:customers:list';
    if (redis && (await redis.status) === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) return NextResponse.json(JSON.parse(cached));
    }

    const client = await pool.connect();
    const query = `
      SELECT 
        c.id,
        c.email,
        c.name,
        c.phone,
        c.company_name,
        c.customer_number,
        c.portal_activated,
        c.created_at,
        COUNT(DISTINCT b.id) as booking_count,
        COALESCE(SUM(b.total_amount_cents), 0) as total_revenue_cents,
        MAX(b.created_at) as last_booking_date
      FROM customers c
      LEFT JOIN webwelle_bookings b ON b.customer_email = c.email
      GROUP BY c.id, c.email, c.name, c.phone, c.company_name, c.customer_number, c.portal_activated, c.created_at
      ORDER BY c.created_at DESC
    `;
    const result = await client.query(query);

    const customers = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      companyName: row.company_name,
      customerNumber: row.customer_number,
      portalActivated: row.portal_activated,
      createdAt: row.created_at,
      stats: {
        bookingCount: parseInt(row.booking_count) || 0,
        totalRevenue: parseInt(row.total_revenue_cents) || 0,
        lastBookingDate: row.last_booking_date,
      }
    }));

    if (redis && (await redis.status) === 'ready') {
      await redis.setex(cacheKey, 300, JSON.stringify(customers));
    }

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Fehler beim Laden der Kunden:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Kunden' }, { status: 500 });
  }
}

async function getCustomerDetails(customerId: string) {
  const client = await pool.connect();
  const customerResult = await client.query('SELECT * FROM customers WHERE id = $1', [customerId]);
  if (customerResult.rows.length === 0) return null;
  const customer = customerResult.rows[0];
  const bookingsResult = await client.query(
    `SELECT * FROM webwelle_bookings WHERE customer_email = $1 ORDER BY created_at DESC`,
    [customer.email]
  );
  return { customer, bookings: bookingsResult.rows, subscriptions: [] };
}


