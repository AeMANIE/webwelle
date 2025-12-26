import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

// POST: Direkt E-Mail an Kunde senden (vom Admin)
export async function POST(request: NextRequest, context: unknown) {
  try {
    const { params } = context as { params: { id: string } };
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const body = await request.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Betreff und Nachricht sind erforderlich' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Kunde abrufen
      const customerRes = await client.query(
        'SELECT id, email, name FROM customers WHERE id = $1',
        [params.id]
      );
      
      if (customerRes.rows.length === 0) {
        return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
      }

      const customer = customerRes.rows[0];

      // E-Mail an Kunde senden
      const emailSent = await sendEmail({
        to: customer.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0e141f; color: #ffffff; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #DCA441; margin: 0;">WebWelle</h1>
              <p style="color: #a0a0a0; margin: 5px 0;">Ihr Partner für Festpreis-Webdesign</p>
            </div>
            
            <div style="background: #1a2332; padding: 30px; border-radius: 10px;">
              <h2 style="color: #ffffff; margin-bottom: 20px;">${subject}</h2>
              <p style="color: #a0a0a0; margin-bottom: 20px;">
                Hallo ${customer.name || 'Kunde'},
              </p>
              <div style="color: #a0a0a0; line-height: 1.6; white-space: pre-wrap;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151;">
              <p style="color: #a0a0a0; font-size: 12px;">
                WebWelle | Allgäu | Bayern<br>
                E-Mail: info@webwelle.com
              </p>
            </div>
          </div>
        `
      });

      if (!emailSent) {
        return NextResponse.json(
          { error: 'Fehler beim Senden der E-Mail' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'E-Mail wurde erfolgreich an den Kunden gesendet'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden der E-Mail' },
      { status: 500 }
    );
  }
}

