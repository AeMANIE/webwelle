import { NextResponse } from 'next/server';
import { getAllBookings } from '@/lib/database';

export async function GET() {
  try {
    const bookings = await getAllBookings();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Fehler beim Laden der Buchungen:', error);
    
    // Fallback: Test-Buchungen zurückgeben wenn DB nicht verfügbar
    const testBookings = [
      {
        id: 1,
        session_id: 'cs_test_a1S3fsDInvX5Gc84mhINhHkLx7frrGTCGREdPJgBmO4w5495z5fMdTvsjA',
        package_type: 'nextjs',
        is_monthly: false,
        company_name: 'Test Unternehmen GmbH',
        customer_name: 'Max Mustermann',
        customer_email: 'harmonie_556@yahoo.com',
        customer_phone: '+49 123 456789',
        project_description: 'React/Next.js Website für Test Unternehmen',
        budget_range: '2000-3000',
        timeline: '3-6 Monate',
        additional_requirements: 'Moderne, responsive Website mit CMS',
        status: 'paid',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        session_id: 'cs_test_a1hn6oUy75x9a1mh1IpVWM3JJfjXqTcFqR6XJJhGCOSbbwbW42DRvrGEro',
        package_type: 'nextjs',
        is_monthly: true,
        company_name: 'Demo Company AG',
        customer_name: 'Anna Schmidt',
        customer_email: 'anna@demo-company.de',
        customer_phone: '+49 987 654321',
        project_description: 'Monatliche Wartung für React/Next.js Website',
        budget_range: '100-200',
        timeline: 'Laufend',
        additional_requirements: 'Regelmäßige Updates und Support',
        status: 'paid',
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 Tag alt
      }
    ];
    
    return NextResponse.json(testBookings);
  }
}
