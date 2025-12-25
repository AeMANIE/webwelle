import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { hashPassword } from '@/lib/password';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    const user = verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });

    const client = await pool.connect();
    try {
      // Prüfe ob Kunde existiert
      const customerRes = await client.query('SELECT id, email FROM customers WHERE id = $1', [params.id]);
      if (customerRes.rows.length === 0) {
        return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
      }

      // Generiere neues zufälliges Passwort
      const newPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '!1';
      
      // Hash das neue Passwort
      const passwordHash = await hashPassword(newPassword);

      // Aktualisiere Passwort in Datenbank
      await client.query('UPDATE customers SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
        passwordHash,
        params.id
      ]);

      return NextResponse.json({ 
        success: true, 
        message: 'Passwort erfolgreich zurückgesetzt',
        newPassword: newPassword // Nur für Admin-Anzeige
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Passworts:', error);
    return NextResponse.json({ error: 'Fehler beim Zurücksetzen des Passworts' }, { status: 500 });
  }
}

