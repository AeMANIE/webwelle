import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email';

// POST: Passwort für Kunde zurücksetzen (Admin-initiiert)
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

      // Reset-Token generieren
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 Stunden gültig

      // Token in Datenbank speichern
      await client.query(
        `UPDATE customers 
         SET reset_token = $1, reset_token_expires = $2, updated_at = NOW()
         WHERE id = $3`,
        [resetToken, expiresAt, params.id]
      );

      // E-Mail an Kunde senden
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

      const emailSent = await sendEmail({
        to: customer.email,
        subject: 'WebWelle - Passwort zurücksetzen (Admin-Anfrage)',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0e141f; color: #ffffff; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #DCA441; margin: 0;">WebWelle</h1>
              <p style="color: #a0a0a0; margin: 5px 0;">Ihr Partner für Festpreis-Webdesign</p>
            </div>
            
            <div style="background: #1a2332; padding: 30px; border-radius: 10px;">
              <h2 style="color: #ffffff; margin-bottom: 20px;">🔐 Passwort zurücksetzen</h2>
              <p style="color: #a0a0a0; margin-bottom: 20px;">
                Hallo ${customer.name || 'Kunde'},
              </p>
              <p style="color: #a0a0a0; margin-bottom: 30px;">
                Ein Administrator hat für Ihr Konto eine Passwort-Zurücksetzung angefordert. 
                Klicken Sie auf den folgenden Link, um ein neues Passwort zu setzen:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background: #DCA441; color: #0e141f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Passwort zurücksetzen
                </a>
              </div>
              <p style="color: #a0a0a0; font-size: 14px; margin-top: 20px;">
                Dieser Link ist 24 Stunden gültig.
              </p>
              <p style="color: #ff6b6b; font-size: 12px; margin-top: 20px; padding: 10px; background: #ff6b6b/10; border-radius: 5px;">
                ⚠️ Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.
              </p>
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
        message: 'Passwort-Reset-E-Mail wurde an den Kunden gesendet'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Passworts:', error);
    return NextResponse.json(
      { error: 'Fehler beim Zurücksetzen des Passworts' },
      { status: 500 }
    );
  }
}

