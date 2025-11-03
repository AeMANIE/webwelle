# Projekt-Plan: 3 Hauptaufgaben

## Übersicht
Dieser Plan beschreibt die detaillierte Umsetzung von 3 großen Features:
1. ✅ **AI-Voice Seite** mit Paketen und Header/Footer Integration - **ABGESCHLOSSEN**
2. ⏳ **E-Mail-System** für Bestellbestätigungen und Kundenportal-Aktivierung - **AUSSTEHEND**
3. ⏳ **Admin-Portal** mit Bestellungen/Kunden/Rechnungen und Blog-Editor - **AUSSTEHEND**

### Status-Zusammenfassung:
- ✅ **Phase 1 (AI-Voice)**: Vollständig implementiert und getestet
- ⏳ **Phase 2 (E-Mail-System)**: Bereit zur Umsetzung
- ⏳ **Phase 3 (Admin-Portal)**: Bereit zur Umsetzung

---

## Aufgabe 1: AI-Voice Seite ✅ **ABGESCHLOSSEN**

**Status**: Vollständig implementiert, getestet und produktionsbereit

### 1.1 Übersicht
Erstellung einer neuen Seite `/ai-voice` mit:
- 3 Hauptpaketen (Mini Job, Midi Job, Festangestellt AI-Agent)
- 1 Zusatzpaket (Einrichtungspaket AI Voice)
- Integration in Header (erste Stelle) und Footer

### 1.2 Price IDs aus CSV
Aus `info/prices (1).csv`:
- **Mini Job AI-Assistent**: `price_1SOvxnQoIwTqROaypfI6ff58` - 399€/Monat
- **Midi Job AI-Assistenz**: `price_1SOvyiQoIwTqROaySSNqaqqE` - 999€/Monat
- **Festangestellt AI-Agent**: `price_1SOvzoQoIwTqROayU9iql5tr` - 1999€/Monat
- **Einrichtungspaket AI Voice**: `price_1SOyytQoIwTqROayNXuZIxWy` - 1499€ (einmalig)

### 1.3 Dateien die erstellt/geändert wurden ✅

#### Neue Dateien: ✅ ALLE ERSTELLT
1. ✅ `src/app/ai-voice/page.tsx` - Hauptseite für AI-Voice **ERSTELLT**
2. ⚠️ `src/app/ai-voice/[package]/page.tsx` - **NICHT ERSTELLT** (direkt auf Hauptseite gebucht)
3. ✅ `src/app/components/AIVoiceCheckout.tsx` - Checkout-Komponente **ERSTELLT**
4. ✅ `src/app/components/AIVoiceFAQ.tsx` - FAQ-Komponente mit Accordion **ERSTELLT**

#### Zu ändernde Dateien: ✅ ALLE GEÄNDERT
1. ✅ `src/lib/stripe.ts` - **GEÄNDERT**
   - ✅ Neue Konfiguration `AI_VOICE_PRICE_CONFIG` hinzugefügt
   - ✅ Funktion `createAIVoiceCheckoutSession()` hinzugefügt
   
2. ✅ `src/app/api/stripe/create-ai-voice-checkout-session/route.ts` - **ERSTELLT**
   - ✅ API Route für AI-Voice Checkout Sessions implementiert
   
3. ✅ `src/app/components/Header.tsx` - **GEÄNDERT**
   - ✅ AI-Voice als ERSTEN Link im Desktop Navigation hinzugefügt (als "Telefonassistent AI")
   - ✅ AI-Voice als ERSTEN Link im Mobile Navigation hinzugefügt
   
4. ✅ `src/app/components/Footer.tsx` - **GEÄNDERT**
   - ✅ AI-Voice Link in der "Leistungen" Sektion hinzugefügt (erste Stelle, als "Telefonassistent AI")

5. ✅ `src/app/api/stripe/webhook/route.ts` - **GEÄNDERT**
   - ✅ Support für AI-Voice Pakete hinzugefügt (packageCategory: 'ai-voice', package_type erweitert)

6. ✅ `src/lib/database.ts` - **GEÄNDERT**
   - ✅ `BookingData` Interface erweitert um `'minijob' | 'midijob' | 'festangestellt' | 'einrichtungspaket'` package_type

### 1.4 Implementierungsdetails



#### 1.4.4 AI-Voice Checkout Flow
- Alle Pakete sind monatliche Subscriptions (außer Einrichtungspaket = einmalig)
- Ähnlich wie KI-Pakete: Vereinfachter Checkout ohne großes Formular
- Kunde wählt Paket → direkt zu Stripe
- Einrichtungspaket kann als Add-on oder separat gebucht werden

### 1.5 Design-Anforderungen
- Moderne, professionelle Seite
- Hero-Section mit Value Proposition
- Drei Paket-Karten (Mini, Midi, Festangestellt)
- Zusatzpaket-Sektion (Einrichtungspaket)
- Features/Benefits Sektion
- Call-to-Action Buttons pro Paket

### 1.6 Fragen vor der Umsetzung
1. Soll das Einrichtungspaket als Checkbox bei den Hauptpaketen erscheinen, oder als separater Button?
2. Gibt es für AI-Voice Pakete auch jährliche Abonnements oder nur monatlich?
3. Welche Features/Details sollen für jedes Paket angezeigt werden?

---

## Aufgabe 2: E-Mail-System

### 2.1 Übersicht
Kunden sollen nach dem Kauf automatisch E-Mails erhalten:
1. **Bestellbestätigung** - sofort nach erfolgreicher Zahlung (alle Pakettypen)
2. **Kundenportal-Aktivierung** - mit Link zum Passwort-Setup und Login

**Redis-Integration**: 
- Aktivierungs-Tokens können optional in Redis gecacht werden (für schnellere Validierung)
- Rate Limiting für E-Mail-Versand bereits vorhanden (über Redis)

### 2.2 Bestehende E-Mail-Funktionen
- ✅ `src/lib/email-confirmation.ts` - existiert bereits für Webdesign-Pakete
- ✅ `src/lib/email.ts` - generische E-Mail-Funktion (`sendEmail()`)
- ✅ `src/lib/email-addon-confirmation.ts` - Add-on Bestätigungen
- ✅ Wird im Stripe Webhook aufgerufen (`src/app/api/stripe/webhook/route.ts`)
- ✅ Redis: Rate Limiting für E-Mail-API-Routes bereits implementiert

### 2.3 Detaillierte Implementierungsplan

#### 2.3.1 Bestellbestätigung erweitern (ALLE Pakettypen)

**Datei**: `src/app/api/stripe/webhook/route.ts`

**Aktueller Status**:
- ✅ Webhook ruft `sendBookingConfirmation()` auf (nur für Webdesign-Pakete mit Formular)
- ✅ KI-Pakete und AI-Voice-Pakete erhalten Bestätigungs-E-Mails (Webhook aktualisiert)
- ✅ Duplikat-Prüfung mit Redis (`email_sent:{session_id}`) aktiv


---

#### 2.3.2 Kundenportal-Aktivierungs-System (NEU)

**Architektur**:
1. **Token-Generierung** (sicher, zufällig, 32 Zeichen)
2. **Token-Speicherung** (PostgreSQL + optional Redis Cache)
3. **Aktivierungs-E-Mail** (professionelles Template)
4. **Passwort-Setup Seite** (Token-Validierung + Formular)
5. **Kunden-Account Aktivierung** (password_hash speichern)

**Schritt 1: Datenbank-Schema**

**Datei**: `info/setup_postgresql_tables.sql` erweitern oder Migration erstellen

```sql
-- Neue Tabelle: customer_portal_tokens
CREATE TABLE IF NOT EXISTS customer_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  booking_id UUID REFERENCES webwelle_bookings(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_portal_tokens_email (customer_email),
  INDEX idx_customer_portal_tokens_token (token),
  INDEX idx_customer_portal_tokens_expires (expires_at)
);

-- Erweitere customers Tabelle um Portal-Felder
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS portal_activated BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS portal_activated_at TIMESTAMP;
```

**Schritt 2: Token-Management-Library**

**Neue Datei**: `src/lib/portal-activation.ts`

```typescript
import { randomBytes } from 'crypto';
import { getRedisClient } from './redis';
import { getClient } from './database';

// Sicheren Token generieren (32 Zeichen, hex)
export function generateActivationToken(): string {
  return randomBytes(16).toString('hex'); // 32 Zeichen
}

// Token in Datenbank speichern
export async function saveActivationToken(
  customerEmail: string,
  token: string,
  bookingId?: string
): Promise<void> {
  const client = await getClient();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 Tage gültig
  
  await client.query(
    `INSERT INTO customer_portal_tokens (customer_email, token, expires_at, booking_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (token) DO NOTHING`,
    [customerEmail, token, expiresAt, bookingId || null]
  );
  
  // Optional: Auch in Redis cachen (für schnellere Validierung)
  const redis = getRedisClient();
  if (redis && (await redis.status) === 'ready') {
    const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
    await redis.setex(`portal_token:${token}`, ttl, customerEmail);
  }
}

// Token validieren
export async function validateActivationToken(token: string): Promise<{
  valid: boolean;
  email?: string;
  expired?: boolean;
  used?: boolean;
  error?: string;
}> {
  // Erst in Redis prüfen (schneller)
  const redis = getRedisClient();
  if (redis && (await redis.status) === 'ready') {
    const cachedEmail = await redis.get(`portal_token:${token}`);
    if (!cachedEmail) {
      // Nicht in Redis, könnte abgelaufen oder nicht existieren
      // Prüfe in DB
    }
  }
  
  // Dann in Datenbank prüfen
  const client = await getClient();
  const result = await client.query(
    `SELECT customer_email, expires_at, used_at
     FROM customer_portal_tokens
     WHERE token = $1`,
    [token]
  );
  
  if (result.rows.length === 0) {
    return { valid: false, error: 'Token nicht gefunden' };
  }
  
  const row = result.rows[0];
  
  if (row.used_at) {
    return { valid: false, used: true, error: 'Token wurde bereits verwendet' };
  }
  
  if (new Date(row.expires_at) < new Date()) {
    return { valid: false, expired: true, error: 'Token ist abgelaufen' };
  }
  
  return { valid: true, email: row.customer_email };
}

// Token als verwendet markieren
export async function markTokenAsUsed(token: string): Promise<void> {
  const client = await getClient();
  await client.query(
    `UPDATE customer_portal_tokens
     SET used_at = CURRENT_TIMESTAMP
     WHERE token = $1`,
    [token]
  );
  
  // Aus Redis entfernen
  const redis = getRedisClient();
  if (redis && (await redis.status) === 'ready') {
    await redis.del(`portal_token:${token}`);
  }
}
```

**Schritt 3: Aktivierungs-E-Mail Template**

**Neue Datei**: `src/lib/email-portal-activation.ts`

```typescript
import { sendEmail } from './email';

interface PortalActivationData {
  customerName: string;
  customerEmail: string;
  activationToken: string;
}

export async function sendPortalActivationEmail(data: PortalActivationData): Promise<{ success: boolean; error?: string }> {
  const { customerName, customerEmail, activationToken } = data;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://webwelle.com';
  const activationLink = `${baseUrl}/customer/activate?token=${activationToken}`;
  
  const subject = 'Ihr Kundenportal ist bereit | WebWelle';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kundenportal aktivieren - WebWelle</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #DCA441 0%, #B8942E 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #0e141f; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">WebWelle</h1>
          <p style="color: #1a2332; font-size: 16px; margin: 0;">Ihr Kundenportal aktivieren</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">Willkommen im Kundenportal!</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hallo ${customerName},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Ihr Kundenportal bei WebWelle ist jetzt bereit! Im Portal können Sie:
          </p>

          <!-- Features -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 30px 0;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 8px 0; color: #374151; font-size: 16px;">
                ✅ Alle Ihre Pakete und Bestellungen einsehen
              </li>
              <li style="padding: 8px 0; color: #374151; font-size: 16px;">
                ✅ Rechnungen herunterladen
              </li>
              <li style="padding: 8px 0; color: #374151; font-size: 16px;">
                ✅ Subscriptions verwalten und kündigen
              </li>
              <li style="padding: 8px 0; color: #374151; font-size: 16px;">
                ✅ Support-Anfragen stellen
              </li>
            </ul>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${activationLink}" 
               style="display: inline-block; background-color: #DCA441; color: #0e141f; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 18px;">
              Kundenportal aktivieren
            </a>
          </div>

          <!-- Info Box -->
          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
              <strong>Wichtig:</strong> Dieser Link ist 7 Tage gültig. Nach dem Aktivieren können Sie sich mit Ihrem Passwort anmelden.
            </p>
          </div>

          <!-- Contact Info -->
          <div style="text-align: center; margin: 40px 0 20px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              Bei Fragen stehen wir Ihnen gerne zur Verfügung:
            </p>
            <p style="color: #DCA441; font-size: 16px; font-weight: 600; margin: 0;">
              📧 info@webwelle.com | 📞 +49 (0) 123 456 789
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
            © 2024 WebWelle. Alle Rechte vorbehalten.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Willkommen im Kundenportal!

Hallo ${customerName},

Ihr Kundenportal bei WebWelle ist jetzt bereit! Im Portal können Sie:
- Alle Ihre Pakete und Bestellungen einsehen
- Rechnungen herunterladen
- Subscriptions verwalten und kündigen
- Support-Anfragen stellen

Aktivieren Sie Ihr Portal hier:
${activationLink}

Wichtig: Dieser Link ist 7 Tage gültig.

Bei Fragen: info@webwelle.com | +49 (0) 123 456 789

© 2024 WebWelle. Alle Rechte vorbehalten.
  `;

  try {
    await sendEmail({
      to: customerEmail,
      subject,
      html,
      text,
    });
    
    console.log(`✅ Portal-Aktivierungs-E-Mail erfolgreich an ${customerEmail} gesendet`);
    return { success: true };
  } catch (error) {
    console.error('❌ Fehler beim Senden der Portal-Aktivierungs-E-Mail:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    };
  }
}
```

**Schritt 4: Passwort-Setup Seite**

**Neue Datei**: `src/app/customer/activate/page.tsx`

```typescript
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { validatePassword } from '@/lib/validation';

function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    if (!token) {
      setError('Kein Aktivierungstoken gefunden');
      setValidating(false);
      setLoading(false);
      return;
    }
    
    // Token validieren
    validateToken();
  }, [token]);
  
  const validateToken = async () => {
    try {
      const response = await fetch(`/api/customer/validate-activation-token?token=${token}`);
      const data = await response.json();
      
      if (!data.valid) {
        setError(data.error || 'Token ungültig oder abgelaufen');
      }
    } catch (err) {
      setError('Fehler beim Validieren des Tokens');
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validierung
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.errors.password || 'Passwort erfüllt nicht die Anforderungen');
      return;
    }
    
    try {
      const response = await fetch('/api/customer/activate-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/customer/login');
        }, 3000);
      } else {
        setError(data.error || 'Fehler beim Aktivieren');
      }
    } catch (err) {
      setError('Fehler beim Aktivieren des Portals');
    }
  };
  
  if (loading || validating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error && !token) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-card rounded-lg p-6 border border-border">
              <h1 className="text-2xl font-bold text-foreground mb-4">Fehler</h1>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">✅ Aktivierung erfolgreich!</h1>
              <p className="text-muted-foreground mb-4">
                Ihr Kundenportal wurde aktiviert. Sie werden zum Login weitergeleitet...
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-card rounded-lg p-8 border border-border">
            <h1 className="text-2xl font-bold text-foreground mb-2">Kundenportal aktivieren</h1>
            <p className="text-muted-foreground mb-6">
              Bitte geben Sie ein Passwort für Ihr Kundenportal ein.
            </p>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Passwort
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mindestens 8 Zeichen, Groß- und Kleinbuchstaben, Zahlen
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Passwort bestätigen
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  required
                  minLength={8}
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Portal aktivieren
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <ActivateContent />
    </Suspense>
  );
}
```

**Schritt 5: API Routes für Aktivierung**

**Neue Datei**: `src/app/api/customer/validate-activation-token/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateActivationToken } from '@/lib/portal-activation';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'Token fehlt' },
      { status: 400 }
    );
  }
  
  try {
    const result = await validateActivationToken(token);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Fehler bei Token-Validierung:', error);
    return NextResponse.json(
      { valid: false, error: 'Fehler bei Token-Validierung' },
      { status: 500 }
    );
  }
}
```

**Neue Datei**: `src/app/api/customer/activate-portal/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateActivationToken, markTokenAsUsed } from '@/lib/portal-activation';
import { hashPassword } from '@/lib/password';
import { getCustomerByEmail, updateCustomer, createCustomer } from '@/lib/database';
import { validatePassword } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token und Passwort sind erforderlich' },
        { status: 400 }
      );
    }
    
    // Token validieren
    const tokenValidation = await validateActivationToken(token);
    if (!tokenValidation.valid) {
      return NextResponse.json(
        { success: false, error: tokenValidation.error || 'Token ungültig' },
        { status: 400 }
      );
    }
    
    // Passwort validieren
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.errors.password },
        { status: 400 }
      );
    }
    
    // Passwort hashen
    const passwordHash = await hashPassword(password);
    
    // Kunde finden oder erstellen
    let customer = await getCustomerByEmail(tokenValidation.email!);
    
    if (!customer) {
      // Neuen Kunden erstellen
      customer = await createCustomer({
        email: tokenValidation.email!,
        password_hash: passwordHash,
        name: tokenValidation.email!.split('@')[0],
        is_verified: true,
        portal_activated: true,
      });
    } else {
      // Bestehenden Kunden aktualisieren
      customer = await updateCustomer(tokenValidation.email!, {
        password_hash: passwordHash,
        portal_activated: true,
        portal_activated_at: new Date(),
      });
    }
    
    // Token als verwendet markieren
    await markTokenAsUsed(token);
    
    return NextResponse.json({ 
      success: true,
      message: 'Portal erfolgreich aktiviert'
    });
  } catch (error) {
    console.error('Fehler bei Portal-Aktivierung:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler bei Portal-Aktivierung' },
      { status: 500 }
    );
  }
}
```

**Schritt 6: Webhook Integration**

**Datei**: `src/app/api/stripe/webhook/route.ts` erweitern

Nach `saveBooking()` und nach Bestellbestätigung:

```typescript
// Nach saveBooking() und Bestellbestätigung
if (bookingData.customer_email && !isSimplifiedCheckout) {
  // Portal-Aktivierungs-Token generieren und senden
  try {
    const { generateActivationToken, saveActivationToken } = await import('@/lib/portal-activation');
    const { sendPortalActivationEmail } = await import('@/lib/email-portal-activation');
    
    const activationToken = generateActivationToken();
    await saveActivationToken(
      bookingData.customer_email,
      activationToken,
      bookingData.id?.toString()
    );
    
    await sendPortalActivationEmail({
      customerName: bookingData.customer_name || bookingData.customer_email.split('@')[0],
      customerEmail: bookingData.customer_email,
      activationToken,
    });
    
    console.log('✅ Portal-Aktivierungs-E-Mail gesendet');
  } catch (error) {
    console.error('❌ Fehler beim Senden der Portal-Aktivierungs-E-Mail:', error);
    // Nicht kritisch - E-Mail kann später manuell gesendet werden
  }
}
```

---

### 2.4 Implementierungs-Reihenfolge (Phase 2)

**Schritt 1**: Datenbank-Schema erweitern
- [x] `customer_portal_tokens` Tabelle erstellen
- [x] `customers` Tabelle erweitern

**Schritt 2**: Helper-Library erstellen
- [x] `src/lib/portal-activation.ts` - Token-Management
- [x] `src/lib/email-helpers.ts` - Paket-Namen, Add-ons extrahieren

**Schritt 3**: E-Mail-Template
- [x] `src/lib/email-portal-activation.ts` - Aktivierungs-E-Mail

**Schritt 4**: Frontend-Seite
- [x] `src/app/customer/activate/page.tsx` - Passwort-Setup

**Schritt 5**: API Routes
- [x] `src/app/api/customer/validate-activation-token/route.ts`
- [x] `src/app/api/customer/activate-portal/route.ts`

**Schritt 6**: Webhook erweitern
- [x] Bestellbestätigung für alle Pakettypen
- [x] Portal-Aktivierungs-E-Mail senden (nur bei Erstkauf)
- [x] Duplikat-Prävention mit Redis

**Schritt 7**: Testing
- [ ] E-Mail-Versand testen
- [ ] Token-Validierung testen
- [ ] Passwort-Setup testen
- [ ] Login mit neuem Passwort testen

---

### 2.5 Offene Fragen

1. **Aktivierungs-Link Gültigkeit**: 7 Tage (empfohlen) ✓
2. **Passwort-Anforderungen**: Mindestens 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen ✓
3. **"Passwort vergessen"**: Soll implementiert werden? (optional, Phase 2.5)

---

## Aufgabe 3: Admin-Portal Erweiterung

### 3.1 Übersicht
Erweiterung des Admin-Portals um:
1. **Tab-Navigation** mit 4 Bereichen: Bestellungen, Kunden, Rechnungen, Blog-Editor
2. **Kunden-Übersicht** mit Statistiken und Details
3. **Rechnungen-Verwaltung** (Synchronisation mit Stripe)
4. **Blog-Editor** mit WYSIWYG (React Quill)
5. **Dynamische Blog-Seite** (aus Datenbank statt hardcoded)

**Redis-Integration**:
- Query Caching für Admin-Dashboard (5-10 Min TTL)
- Caching für Kunden-Liste (2-5 Min TTL)
- Caching für Rechnungen (5-10 Min TTL)
- Blog-Artikel Cache (invalidiert bei Änderungen)

### 3.2 Bestehende Admin-Struktur
- ✅ `src/app/admin/page.tsx` - Hauptseite (zeigt aktuell nur Buchungen)
- ✅ `src/app/admin/login/page.tsx` - Admin Login
- ✅ `src/app/api/bookings/route.ts` - API für Buchungen
- ✅ `src/lib/database.ts` - Database-Funktionen
- ✅ `src/lib/stripe.ts` - Stripe Integration

### 3.3 Detaillierte Implementierungsplan

#### 3.3.1 Admin Dashboard mit Tab-Navigation

**Datei**: `src/app/admin/page.tsx` erweitern

**Schritt 1: Tab-Navigation Component erstellen**

**Neue Datei**: `src/app/components/admin/AdminTabs.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Package, Users, FileText, Edit3 } from 'lucide-react';

type TabId = 'bookings' | 'customers' | 'invoices' | 'blog';

interface AdminTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  const tabs = [
    { id: 'bookings' as TabId, label: 'Bestellungen', icon: Package },
    { id: 'customers' as TabId, label: 'Kunden', icon: Users },
    { id: 'invoices' as TabId, label: 'Rechnungen', icon: FileText },
    { id: 'blog' as TabId, label: 'Blog-Editor', icon: Edit3 },
  ];

  return (
    <div className="border-b border-border mb-6">
      <nav className="flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
```

**Schritt 2: Admin-Seite umbauen**

**Datei**: `src/app/admin/page.tsx` refactoren

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AdminTabs from '../components/admin/AdminTabs';
import BookingsTab from '../components/admin/BookingsTab';
import CustomersTab from '../components/admin/CustomersTab';
import InvoicesTab from '../components/admin/InvoicesTab';
import BlogTab from '../components/admin/BlogTab';

type TabId = 'bookings' | 'customers' | 'invoices' | 'blog';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('bookings');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const router = useRouter();

  // ... Auth-Logik ...

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin-Dashboard</h1>
            <p className="text-muted-foreground">Verwalten Sie Bestellungen, Kunden, Rechnungen und Blog-Artikel</p>
          </div>

          <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          {activeTab === 'bookings' && <BookingsTab />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'invoices' && <InvoicesTab />}
          {activeTab === 'blog' && <BlogTab />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

---

#### 3.3.2 Kunden-Übersicht (NEU)

**Schritt 1: Kunden-API mit Caching**

**Neue Datei**: `src/app/api/admin/customers/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/database';
import { getRedisClient } from '@/lib/redis';
import { verifyToken } from '@/lib/auth';

// GET: Liste aller Kunden mit Statistiken
export async function GET(request: NextRequest) {
  try {
    // Admin-Auth prüfen
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const customerId = request.nextUrl.searchParams.get('id');
    
    // Einzelner Kunde
    if (customerId) {
      const customer = await getCustomerDetails(customerId);
      return NextResponse.json(customer);
    }

    // Liste aller Kunden (mit Cache)
    const redis = getRedisClient();
    const cacheKey = 'admin:customers:list';
    
    // Prüfe Cache
    if (redis && (await redis.status) === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    }

    // Aus Datenbank laden
    const client = await getClient();
    
    // Alle Kunden mit Statistiken
    const query = `
      SELECT 
        c.id,
        c.email,
        c.name,
        c.phone,
        c.company_name,
        c.portal_activated,
        c.created_at,
        COUNT(DISTINCT b.id) as booking_count,
        COALESCE(SUM(b.total_amount_cents), 0) as total_revenue_cents,
        MAX(b.created_at) as last_booking_date
      FROM customers c
      LEFT JOIN webwelle_bookings b ON b.customer_email = c.email
      GROUP BY c.id, c.email, c.name, c.phone, c.company_name, c.portal_activated, c.created_at
      ORDER BY c.created_at DESC
    `;
    
    const result = await client.query(query);
    
    const customers = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      companyName: row.company_name,
      portalActivated: row.portal_activated,
      createdAt: row.created_at,
      stats: {
        bookingCount: parseInt(row.booking_count) || 0,
        totalRevenue: parseInt(row.total_revenue_cents) || 0,
        lastBookingDate: row.last_booking_date,
      }
    }));

    // Cache speichern (5 Minuten)
    if (redis && (await redis.status) === 'ready') {
      await redis.setex(cacheKey, 300, JSON.stringify(customers));
    }

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Fehler beim Laden der Kunden:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Kunden' },
      { status: 500 }
    );
  }
}

// Einzelner Kunde mit Details
async function getCustomerDetails(customerId: string) {
  const client = await getClient();
  
  // Kunde
  const customerResult = await client.query(
    'SELECT * FROM customers WHERE id = $1',
    [customerId]
  );
  
  if (customerResult.rows.length === 0) {
    return null;
  }
  
  const customer = customerResult.rows[0];
  
  // Buchungen
  const bookingsResult = await client.query(
    `SELECT * FROM webwelle_bookings 
     WHERE customer_email = $1 
     ORDER BY created_at DESC`,
    [customer.email]
  );
  
  // Subscriptions (aus Stripe)
  // ... Stripe API Call ...
  
  return {
    customer,
    bookings: bookingsResult.rows,
    subscriptions: [], // Von Stripe
  };
}
```

**Schritt 2: CustomersTab Component**

**Neue Datei**: `src/app/components/admin/CustomersTab.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Phone, Building, Euro, Calendar, Eye } from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  companyName?: string;
  portalActivated: boolean;
  createdAt: string;
  stats: {
    bookingCount: number;
    totalRevenue: number;
    lastBookingDate?: string;
  };
}

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kunden:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.email.toLowerCase().includes(filter.toLowerCase()) ||
    customer.name?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Lade Kunden...</div>;
  }

  return (
    <div>
      {/* Filter */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Nach E-Mail oder Name suchen..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-background border border-border rounded-lg text-foreground"
        />
      </div>

      {/* Kunden-Liste */}
      <div className="grid gap-4">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {customer.name || 'Kein Name'}
                  </h3>
                  {customer.portalActivated && (
                    <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs">
                      Portal aktiviert
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {customer.email}
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.companyName && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      {customer.companyName}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{customer.stats.bookingCount} Bestellungen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-primary" />
                    <span>{(customer.stats.totalRevenue / 100).toFixed(2)} €</span>
                  </div>
                  {customer.stats.lastBookingDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        Letzte: {new Date(customer.stats.lastBookingDate).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(customer)}
                className="ml-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Kunden-Detail Modal (später implementieren) */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {selectedCustomer.name || selectedCustomer.email}
            </h2>
            {/* Details anzeigen */}
            <button
              onClick={() => setSelectedCustomer(null)}
              className="mt-4 px-4 py-2 bg-muted text-foreground rounded-lg"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

#### 3.3.3 Rechnungen-Übersicht (NEU)

**Schritt 1: Rechnungen-API (Stripe Integration)**

**Neue Datei**: `src/app/api/admin/invoices/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getStripeInstance } from '@/lib/stripe';
import { verifyToken } from '@/lib/auth';
import { getRedisClient } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    // Admin-Auth
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    // Cache prüfen
    const redis = getRedisClient();
    const cacheKey = 'admin:invoices:list';
    
    if (redis && (await redis.status) === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    }

    // Von Stripe abrufen
    const stripe = getStripeInstance();
    const invoices = await stripe.invoices.list({
      limit: 100,
      expand: ['data.customer', 'data.subscription'],
    });

    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.number,
      customerEmail: typeof invoice.customer === 'object' && invoice.customer?.email 
        ? invoice.customer.email 
        : null,
      customerName: typeof invoice.customer === 'object' && invoice.customer?.name 
        ? invoice.customer.name 
        : null,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      paidAt: invoice.status_transitions?.paid_at 
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : null,
      dueDate: invoice.due_date 
        ? new Date(invoice.due_date * 1000).toISOString()
        : null,
      pdfUrl: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      createdAt: new Date(invoice.created * 1000).toISOString(),
    }));

    // Cache speichern (10 Minuten)
    if (redis && (await redis.status) === 'ready') {
      await redis.setex(cacheKey, 600, JSON.stringify(formattedInvoices));
    }

    return NextResponse.json(formattedInvoices);
  } catch (error) {
    console.error('Fehler beim Laden der Rechnungen:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Rechnungen' },
      { status: 500 }
    );
  }
}
```

**Schritt 2: InvoicesTab Component**

**Neue Datei**: `src/app/components/admin/InvoicesTab.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Euro, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerEmail: string | null;
  customerName: string | null;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  dueDate: string | null;
  pdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  createdAt: string;
}

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/admin/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Rechnungen:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lade Rechnungen...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          Rechnungen ({invoices.length})
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-semibold text-foreground">Rechnung</th>
              <th className="text-left p-4 font-semibold text-foreground">Kunde</th>
              <th className="text-left p-4 font-semibold text-foreground">Betrag</th>
              <th className="text-left p-4 font-semibold text-foreground">Status</th>
              <th className="text-left p-4 font-semibold text-foreground">Datum</th>
              <th className="text-left p-4 font-semibold text-foreground">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-border hover:bg-card/50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-mono text-sm">{invoice.invoiceNumber}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    {invoice.customerName && (
                      <div className="font-medium text-foreground">{invoice.customerName}</div>
                    )}
                    <div className="text-sm text-muted-foreground">{invoice.customerEmail || 'N/A'}</div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-primary" />
                    <span className="font-semibold">
                      {invoice.amount.toFixed(2)} {invoice.currency}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {invoice.status === 'paid' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-500">Bezahlt</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-500">Ausstehend</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {invoice.paidAt 
                        ? new Date(invoice.paidAt).toLocaleDateString('de-DE')
                        : invoice.dueDate 
                          ? new Date(invoice.dueDate).toLocaleDateString('de-DE')
                          : new Date(invoice.createdAt).toLocaleDateString('de-DE')
                      }
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  {invoice.pdfUrl && (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

#### 3.3.4 Blog-Editor mit WYSIWYG (NEU)

**Schritt 1: WYSIWYG Editor installieren**

```bash
npm install react-quill quill
```

**Schritt 2: Datenbank-Schema**

**Datei**: `info/setup_postgresql_tables.sql` erweitern

```sql
-- Blog-Posts Tabelle
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author VARCHAR(255) DEFAULT 'SEO-Team WebWelle',
  featured_image_url VARCHAR(500),
  meta_description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft' | 'published'
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) -- Admin E-Mail
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
```

**Schritt 3: Blog-Database-Funktionen**

**Neue Datei**: `src/lib/blog-database.ts`

```typescript
import { getClient } from './database';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author: string;
  featuredImageUrl?: string;
  metaDescription?: string;
  tags: string[];
  featured: boolean;
  status: 'draft' | 'published';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Alle Blog-Posts abrufen
export async function getAllBlogPosts(
  status?: 'draft' | 'published'
): Promise<BlogPost[]> {
  const client = await getClient();
  
  let query = 'SELECT * FROM blog_posts';
  const params: unknown[] = [];
  
  if (status) {
    query += ' WHERE status = $1';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const result = await client.query(query, params);
  
  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    featuredImageUrl: row.featured_image_url,
    metaDescription: row.meta_description,
    tags: row.tags || [],
    featured: row.featured || false,
    status: row.status,
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
  }));
}

// Einzelner Blog-Post
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const client = await getClient();
  
  const result = await client.query(
    'SELECT * FROM blog_posts WHERE slug = $1',
    [slug]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    featuredImageUrl: row.featured_image_url,
    metaDescription: row.meta_description,
    tags: row.tags || [],
    featured: row.featured || false,
    status: row.status,
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
  };
}

// Blog-Post erstellen
export async function createBlogPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
  const client = await getClient();
  
  const result = await client.query(
    `INSERT INTO blog_posts (
      title, slug, excerpt, content, author, featured_image_url, 
      meta_description, tags, featured, status, published_at, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      post.title,
      post.slug,
      post.excerpt || null,
      post.content,
      post.author,
      post.featuredImageUrl || null,
      post.metaDescription || null,
      post.tags,
      post.featured,
      post.status,
      post.status === 'published' ? new Date() : null,
      post.createdBy || null,
    ]
  );
  
  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    featuredImageUrl: row.featured_image_url,
    metaDescription: row.meta_description,
    tags: row.tags || [],
    featured: row.featured || false,
    status: row.status,
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
  };
}

// Blog-Post aktualisieren
export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
  const client = await getClient();
  
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;
  
  if (updates.title) {
    fields.push(`title = $${paramCount++}`);
    values.push(updates.title);
  }
  if (updates.slug) {
    fields.push(`slug = $${paramCount++}`);
    values.push(updates.slug);
  }
  if (updates.excerpt !== undefined) {
    fields.push(`excerpt = $${paramCount++}`);
    values.push(updates.excerpt || null);
  }
  if (updates.content) {
    fields.push(`content = $${paramCount++}`);
    values.push(updates.content);
  }
  if (updates.featuredImageUrl !== undefined) {
    fields.push(`featured_image_url = $${paramCount++}`);
    values.push(updates.featuredImageUrl || null);
  }
  if (updates.metaDescription !== undefined) {
    fields.push(`meta_description = $${paramCount++}`);
    values.push(updates.metaDescription || null);
  }
  if (updates.tags) {
    fields.push(`tags = $${paramCount++}`);
    values.push(updates.tags);
  }
  if (updates.featured !== undefined) {
    fields.push(`featured = $${paramCount++}`);
    values.push(updates.featured);
  }
  if (updates.status) {
    fields.push(`status = $${paramCount++}`);
    values.push(updates.status);
    
    // Wenn auf 'published' gesetzt, published_at setzen
    if (updates.status === 'published') {
      fields.push(`published_at = $${paramCount++}`);
      values.push(new Date());
    }
  }
  
  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);
  
  const result = await client.query(
    `UPDATE blog_posts 
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    featuredImageUrl: row.featured_image_url,
    metaDescription: row.meta_description,
    tags: row.tags || [],
    featured: row.featured || false,
    status: row.status,
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
  };
}

// Blog-Post löschen
export async function deleteBlogPost(id: string): Promise<boolean> {
  const client = await getClient();
  
  const result = await client.query(
    'DELETE FROM blog_posts WHERE id = $1',
    [id]
  );
  
  return result.rowCount ? result.rowCount > 0 : false;
}

// Slug generieren aus Titel
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

**Schritt 4: Blog-API Routes**

**Neue Datei**: `src/app/api/admin/blog/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllBlogPosts, createBlogPost, generateSlug } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';

// GET: Liste aller Blog-Posts
// POST: Neuen Blog-Post erstellen
export async function GET(request: NextRequest) {
  try {
    // Admin-Auth
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const status = request.nextUrl.searchParams.get('status') as 'draft' | 'published' | undefined;
    
    // Cache prüfen (nur für published Posts)
    const redis = getRedisClient();
    const cacheKey = status === 'published' 
      ? 'admin:blog:published'
      : 'admin:blog:all';
    
    if (redis && (await redis.status) === 'ready' && status === 'published') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    }

    const posts = await getAllBlogPosts(status);

    // Cache speichern (nur für published)
    if (redis && (await redis.status) === 'ready' && status === 'published') {
      await redis.setex(cacheKey, 300, JSON.stringify(posts)); // 5 Minuten
    }

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Fehler beim Laden der Blog-Posts:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Blog-Posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin-Auth
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const body = await request.json();
    const { title, excerpt, content, author, featuredImageUrl, metaDescription, tags, featured, status } = body;
    
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Titel und Inhalt sind erforderlich' },
        { status: 400 }
      );
    }

    // Slug generieren
    let slug = body.slug || generateSlug(title);
    
    // Prüfen ob Slug bereits existiert
    const existingPosts = await getAllBlogPosts();
    let finalSlug = slug;
    let counter = 1;
    while (existingPosts.some(p => p.slug === finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const post = await createBlogPost({
      title,
      slug: finalSlug,
      excerpt: excerpt || null,
      content,
      author: author || 'SEO-Team WebWelle',
      featuredImageUrl: featuredImageUrl || null,
      metaDescription: metaDescription || null,
      tags: tags || [],
      featured: featured || false,
      status: status || 'draft',
      createdBy: user.email,
    });

    // Cache invalidieren
    const redis = getRedisClient();
    if (redis && (await redis.status) === 'ready') {
      await redis.del('admin:blog:all');
      await redis.del('admin:blog:published');
      await redis.del('blog:public:list'); // Public Blog-Liste
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Fehler beim Erstellen des Blog-Posts:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Blog-Posts' },
      { status: 500 }
    );
  }
}
```

**Neue Datei**: `src/app/api/admin/blog/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getBlogPostBySlug, updateBlogPost, deleteBlogPost } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';

// GET: Einzelner Blog-Post
// PUT: Blog-Post aktualisieren
// DELETE: Blog-Post löschen

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin-Auth
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const post = await getBlogPostBySlug(params.id);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Blog-Post nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Fehler beim Laden des Blog-Posts:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Blog-Posts' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin-Auth
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const body = await request.json();
    const updated = await updateBlogPost(params.id, body);

    if (!updated) {
      return NextResponse.json(
        { error: 'Blog-Post nicht gefunden' },
        { status: 404 }
      );
    }

    // Cache invalidieren
    const redis = getRedisClient();
    if (redis && (await redis.status) === 'ready') {
      await redis.del('admin:blog:all');
      await redis.del('admin:blog:published');
      await redis.del(`blog:post:${params.id}`);
      await redis.del('blog:public:list');
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Blog-Posts:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Blog-Posts' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin-Auth
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    const deleted = await deleteBlogPost(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Blog-Post nicht gefunden' },
        { status: 404 }
      );
    }

    // Cache invalidieren
    const redis = getRedisClient();
    if (redis && (await redis.status) === 'ready') {
      await redis.del('admin:blog:all');
      await redis.del('admin:blog:published');
      await redis.del(`blog:post:${params.id}`);
      await redis.del('blog:public:list');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen des Blog-Posts:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Blog-Posts' },
      { status: 500 }
    );
  }
}
```

**Schritt 5: Blog-Editor Component**

**Neue Datei**: `src/app/components/admin/BlogEditor.tsx`

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamischer Import für React Quill (nur Client-Side)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author: string;
  featuredImageUrl?: string;
  metaDescription?: string;
  tags: string[];
  featured: boolean;
  status: 'draft' | 'published';
}

interface BlogEditorProps {
  post?: BlogPost;
  onSave: () => void;
}

export default function BlogEditor({ post, onSave }: BlogEditorProps) {
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [content, setContent] = useState(post?.content || '');
  const [author, setAuthor] = useState(post?.author || 'SEO-Team WebWelle');
  const [featuredImageUrl, setFeaturedImageUrl] = useState(post?.featuredImageUrl || '');
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription || '');
  const [tags, setTags] = useState(post?.tags?.join(', ') || '');
  const [featured, setFeatured] = useState(post?.featured || false);
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status || 'draft');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slug automatisch generieren aus Titel
  useEffect(() => {
    if (!post && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  }, [title, post]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const postData = {
        title,
        slug,
        excerpt,
        content,
        author,
        featuredImageUrl,
        metaDescription,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        featured,
        status,
      };

      const url = post?.id 
        ? `/api/admin/blog/${post.id}`
        : '/api/admin/blog';
      
      const method = post?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Speichern');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Titel */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Titel *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
          placeholder="Artikel-Titel"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Slug (URL) *
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground font-mono text-sm"
          placeholder="url-freundlicher-slug"
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Kurzbeschreibung
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
          placeholder="Kurze Beschreibung für die Übersicht"
        />
      </div>

      {/* Content Editor */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Inhalt *
        </label>
        {typeof window !== 'undefined' && (
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            placeholder="Schreiben Sie hier Ihren Artikel..."
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['code-block'],
                ['clean']
              ],
            }}
            className="bg-background text-foreground"
          />
        )}
      </div>

      {/* Meta-Felder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Autor
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Featured Image URL
          </label>
          <input
            type="url"
            value={featuredImageUrl}
            onChange={(e) => setFeaturedImageUrl(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Meta Description (SEO)
        </label>
        <textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
          placeholder="Beschreibung für Suchmaschinen (150-160 Zeichen)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tags (kommagetrennt)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
          placeholder="SEO, Webdesign, Allgäu"
        />
      </div>

      {/* Options */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium text-foreground">Featured</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            className="px-4 py-2 bg-background border border-border rounded-lg text-foreground"
          >
            <option value="draft">Entwurf</option>
            <option value="published">Veröffentlicht</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving || !title || !content}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </button>
        {status === 'draft' && (
          <button
            onClick={() => {
              setStatus('published');
              setTimeout(handleSave, 100);
            }}
            disabled={saving || !title || !content}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Veröffentlichen
          </button>
        )}
      </div>
    </div>
  );
}
```

**Schritt 6: BlogTab Component**

**Neue Datei**: `src/app/components/admin/BlogTab.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import BlogEditor from './BlogEditor';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: 'draft' | 'published';
  featured: boolean;
  createdAt: string;
  publishedAt?: string;
}

export default function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/admin/blog');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Blog-Posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Artikel wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lade Blog-Artikel...</div>;
  }

  if (showEditor) {
    return (
      <div>
        <button
          onClick={() => {
            setShowEditor(false);
            setEditingPost(null);
          }}
          className="mb-4 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80"
        >
          ← Zurück zur Übersicht
        </button>
        <BlogEditor
          post={editingPost || undefined}
          onSave={() => {
            fetchPosts();
            setShowEditor(false);
            setEditingPost(null);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          Blog-Artikel ({posts.length})
        </h2>
        <button
          onClick={() => {
            setEditingPost(null);
            setShowEditor(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          Neuer Artikel
        </button>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {post.title}
                  </h3>
                  {post.status === 'published' && (
                    <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs">
                      Veröffentlicht
                    </span>
                  )}
                  {post.status === 'draft' && (
                    <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs">
                      Entwurf
                    </span>
                  )}
                  {post.featured && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                      Featured
                    </span>
                  )}
                </div>
                
                {post.excerpt && (
                  <p className="text-muted-foreground mb-2">{post.excerpt}</p>
                )}
                
                <div className="text-sm text-muted-foreground">
                  <span>Slug: /blog/{post.slug}</span>
                  {post.publishedAt && (
                    <span className="ml-4">
                      Veröffentlicht: {new Date(post.publishedAt).toLocaleDateString('de-DE')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted rounded transition-colors"
                  title="Ansehen"
                >
                  <Eye className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    setEditingPost(post as any);
                    setShowEditor(true);
                  }}
                  className="p-2 hover:bg-muted rounded transition-colors"
                  title="Bearbeiten"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-2 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                  title="Löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Schritt 7: Blog-Seite dynamisch machen**

**Datei**: `src/app/blog/page.tsx` refactoren

```typescript
import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, User, ArrowRight, Tag } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import { getAllBlogPosts } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';

export const metadata: Metadata = {
  title: "Blog & Insights | WebWelle – Webdesign Kempten (Allgäu)",
  description: "Lokale SEO-Artikel und Webdesign-Insights aus Kempten. Tipps für digitale Sichtbarkeit im Allgäu und Bayern.",
};

export default async function BlogPage() {
  // Cache prüfen
  const redis = getRedisClient();
  let posts;
  
  if (redis && (await redis.status) === 'ready') {
    const cached = await redis.get('blog:public:list');
    if (cached) {
      posts = JSON.parse(cached);
    }
  }
  
  if (!posts) {
    // Nur veröffentlichte Posts
    posts = await getAllBlogPosts('published');
    
    // Cache speichern (15 Minuten)
    if (redis && (await redis.status) === 'ready') {
      await redis.setex('blog:public:list', 900, JSON.stringify(posts));
    }
  }

  const featuredPosts = posts.filter((post: { featured: boolean }) => post.featured);
  const regularPosts = posts.filter((post: { featured: boolean }) => !post.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* ... Rest der Seite mit dynamischen Posts ... */}
      <Footer />
      <ScrollToTop />
    </div>
  );
}
```

**Neue Datei**: `src/app/blog/[slug]/page.tsx`

```typescript
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getBlogPostBySlug } from '@/lib/blog-database';
import { getRedisClient } from '@/lib/redis';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  
  if (!post || post.status !== 'published') {
    return {
      title: 'Artikel nicht gefunden | WebWelle',
    };
  }

  return {
    title: `${post.title} | WebWelle Blog`,
    description: post.metaDescription || post.excerpt || '',
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  // Cache prüfen
  const redis = getRedisClient();
  let post;
  
  if (redis && (await redis.status) === 'ready') {
    const cached = await redis.get(`blog:post:${params.slug}`);
    if (cached) {
      post = JSON.parse(cached);
    }
  }
  
  if (!post) {
    post = await getBlogPostBySlug(params.slug);
    
    // Cache speichern (nur wenn published)
    if (post && post.status === 'published' && redis && (await redis.status) === 'ready') {
      await redis.setex(`blog:post:${params.slug}`, 3600, JSON.stringify(post)); // 1 Stunde
    }
  }

  if (!post || post.status !== 'published') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <article className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-4">{post.title}</h1>
        {/* Meta-Infos, Content, etc. */}
        <div 
          className="prose prose-invert max-w-none mt-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
      <Footer />
    </div>
  );
}
```

---

#### 3.3.5 Kündigungslogik (Ergänzung)

**Funktionalität**:
- Berechnung der Kündigungsfrist basierend auf Subscription-Startdatum
- Monthly: 24 Monate Vertrag → kündbar ab: start_date + 24 Monate
- Yearly: 2 Jahre Vertrag → kündbar ab: start_date + 24 Monate

**Helper-Funktion**: `src/lib/subscription-utils.ts`

```typescript
export function calculateCancellationDate(
  startDate: Date,
  billingInterval: 'monthly' | 'yearly'
): Date {
  const cancellationDate = new Date(startDate);
  
  if (billingInterval === 'monthly') {
    cancellationDate.setMonth(cancellationDate.getMonth() + 24);
  } else {
    cancellationDate.setFullYear(cancellationDate.getFullYear() + 2);
  }
  
  return cancellationDate;
}

export function isCancellable(
  startDate: Date,
  billingInterval: 'monthly' | 'yearly'
): boolean {
  const cancellationDate = calculateCancellationDate(startDate, billingInterval);
  return new Date() >= cancellationDate;
}
```

---

### 3.4 Implementierungs-Reihenfolge (Phase 3)

**Schritt 1**: Tab-Navigation
- [ ] `AdminTabs.tsx` Component erstellen
- [ ] `AdminPage` refactoren mit Tabs

**Schritt 2**: Kunden-Übersicht
- [ ] Datenbank-Query für Kunden mit Statistiken
- [ ] `CustomersTab.tsx` Component
- [ ] `/api/admin/customers` API Route
- [ ] Redis Caching (2-5 Min)

**Schritt 3**: Rechnungen
- [ ] Stripe Integration für Rechnungen
- [ ] `InvoicesTab.tsx` Component
- [ ] `/api/admin/invoices` API Route
- [ ] Redis Caching (5-10 Min)

**Schritt 4**: Blog-Editor
- [ ] Datenbank-Schema für `blog_posts`
- [ ] `blog-database.ts` Library
- [ ] Blog-API Routes (GET, POST, PUT, DELETE)
- [ ] `BlogEditor.tsx` mit React Quill
- [ ] `BlogTab.tsx` Component

**Schritt 5**: Blog-Seite dynamisch
- [ ] `src/app/blog/page.tsx` refactoren
- [ ] `src/app/blog/[slug]/page.tsx` erstellen
- [ ] Redis Caching für Public Blog-Liste

**Schritt 6**: Kündigungslogik
- [ ] Helper-Funktionen für Kündigungsberechnung
- [ ] Anzeige in Kunden-Detail

---

### 3.5 Offene Fragen & Entscheidungen

1. **WYSIWYG-Bibliothek**: ✅ **React Quill** (empfohlen, einfach, gut dokumentiert)
2. **Bild-Upload**: URLs oder Upload? → **Empfehlung**: Zuerst URLs, später Upload-Funktion
3. **Artikel-Preview**: ✅ Ja, in Editor integriert
4. **Versionierung**: ❌ Nicht in Phase 3, später optional
5. **Kündigungslogik**: Berechnung im Frontend oder Backend? → **Backend** (sicherer)

---

## Implementierungs-Reihenfolge

### Phase 1: AI-Voice Seite ✅ ABGESCHLOSSEN
1. ✅ Price IDs in `stripe.ts` hinzufügen - **ERLEDIGT**
2. ✅ Header & Footer anpassen - **ERLEDIGT** (AI-Voice als "Telefonassistent AI" im Header/Footer)
3. ✅ AI-Voice Hauptseite erstellen - **ERLEDIGT** (`src/app/ai-voice/page.tsx` mit Content aus `aivoice.txt`)
4. ✅ Checkout-Komponente erstellen - **ERLEDIGT** (`AIVoiceCheckout.tsx` mit Einrichtungspaket-Option)
5. ✅ API Route erstellen - **ERLEDIGT** (`/api/stripe/create-ai-voice-checkout-session`)
6. ✅ Webhook erweitern - **ERLEDIGT** (Unterstützung für AI-Voice Pakete im Webhook)
7. ✅ Database Interface erweitert - **ERLEDIGT** (BookingData unterstützt minijob, midijob, festangestellt, einrichtungspaket)
8. ✅ FAQ-Komponente erstellt - **ERLEDIGT** (`AIVoiceFAQ.tsx` mit klappbarer Accordion-Funktionalität)
9. ✅ Build erfolgreich getestet - **ERLEDIGT**

### Phase 2: E-Mail-System (DETAILLIERT GEPLANT)

**Schritt 1**: Datenbank-Schema erweitern
- [ ] `customer_portal_tokens` Tabelle erstellen
- [ ] `customers` Tabelle erweitern (password_hash, portal_activated, portal_activated_at)

**Schritt 2**: Helper-Library erstellen
- [ ] `src/lib/portal-activation.ts` - Token-Management (mit Redis-Caching)
- [ ] `src/lib/email-helpers.ts` - Paket-Namen, Add-ons extrahieren

**Schritt 3**: E-Mail-Template
- [ ] `src/lib/email-portal-activation.ts` - Aktivierungs-E-Mail mit professionellem Design

**Schritt 4**: Frontend-Seite
- [ ] `src/app/customer/activate/page.tsx` - Passwort-Setup mit Token-Validierung

**Schritt 5**: API Routes
- [ ] `src/app/api/customer/validate-activation-token/route.ts` - Token validieren
- [ ] `src/app/api/customer/activate-portal/route.ts` - Portal aktivieren & Passwort speichern

**Schritt 6**: Webhook erweitern
- [ ] Bestellbestätigung für ALLE Pakettypen (Webdesign, KI, AI-Voice)
- [ ] Portal-Aktivierungs-E-Mail senden
- [ ] Duplikat-Prävention mit Redis (`email_sent:{session_id}`)

**Schritt 7**: Testing
- [x] E-Mail-Versand testen (Test-E-Mail erfolgreich empfangen ✅)
- [ ] E-Mail-Versand nach echter Bestellung testen (Webhook)
- [ ] Token-Validierung testen (Redis + DB)
- [ ] Passwort-Setup testen
- [ ] Login mit neuem Passwort testen

### Phase 3: Admin-Portal (DETAILLIERT GEPLANT)

**Schritt 1**: Tab-Navigation
- [ ] `src/app/components/admin/AdminTabs.tsx` Component erstellen
- [ ] `src/app/admin/page.tsx` refactoren mit Tab-System

**Schritt 2**: Kunden-Übersicht
- [ ] Datenbank-Query für Kunden mit Statistiken (JOIN mit bookings)
- [ ] `src/app/components/admin/CustomersTab.tsx` Component
- [ ] `src/app/api/admin/customers/route.ts` API Route
- [ ] Redis Caching (5 Min TTL für Kunden-Liste)

**Schritt 3**: Rechnungen
- [ ] Stripe Integration (`stripe.invoices.list()`)
- [ ] `src/app/components/admin/InvoicesTab.tsx` Component
- [ ] `src/app/api/admin/invoices/route.ts` API Route
- [ ] Redis Caching (10 Min TTL für Rechnungen)

**Schritt 4**: Blog-Editor
- [ ] Datenbank-Schema für `blog_posts` erstellen
- [ ] `src/lib/blog-database.ts` Library (CRUD-Operationen)
- [ ] Blog-API Routes (GET, POST, PUT, DELETE)
- [ ] `src/app/components/admin/BlogEditor.tsx` mit React Quill
- [ ] `src/app/components/admin/BlogTab.tsx` Component
- [ ] Redis Caching + Cache-Invalidierung bei Änderungen

**Schritt 5**: Blog-Seite dynamisch
- [ ] `src/app/blog/page.tsx` refactoren (aus DB statt hardcoded)
- [ ] `src/app/blog/[slug]/page.tsx` erstellen (dynamische Route)
- [ ] Redis Caching für Public Blog-Liste (15 Min TTL)

**Schritt 6**: Kündigungslogik
- [ ] `src/lib/subscription-utils.ts` - Helper für Kündigungsberechnung
- [ ] Anzeige in Kunden-Detail (kündbar ab: [Datum])

---

## Technische Anforderungen

### Dependencies die hinzugefügt werden müssen:
1. **WYSIWYG Editor**: 
   - ✅ `react-quill` - Empfohlen (einfach, gut dokumentiert)
   - ✅ `quill` (CSS für react-quill)
   - Installieren: `npm install react-quill quill`

2. **Token Generation**:
   - ✅ `crypto` - Bereits vorhanden (Node.js built-in)

3. **Password Hashing**:
   - ✅ `bcryptjs` - Bereits vorhanden (in `package.json`)

4. **Redis Client**:
   - ✅ `ioredis` - Bereits installiert (für Caching)

### Datenbank-Migrationen:
1. **`customer_portal_tokens` Tabelle** (NEU)
   - Token-Management für Portal-Aktivierung
   - 7 Tage TTL für Tokens
   - Einmalig verwendbar

2. **`blog_posts` Tabelle** (NEU)
   - Vollständige Blog-Verwaltung
   - Status: draft/published
   - Tags als Array
   - Featured-Flag

3. **`customers` Tabelle erweitern** (NEU)
   - `password_hash` VARCHAR(255)
   - `portal_activated` BOOLEAN
   - `portal_activated_at` TIMESTAMP

### Redis Cache-Keys (Übersicht):
- `email_sent:{session_id}` - E-Mail-Duplikat-Prävention (24h TTL)
- `portal_token:{token}` - Portal-Token Cache (7 Tage TTL)
- `admin:customers:list` - Kunden-Liste (5 Min TTL)
- `admin:invoices:list` - Rechnungen-Liste (10 Min TTL)
- `admin:blog:published` - Veröffentlichte Blog-Posts (5 Min TTL)
- `blog:public:list` - Public Blog-Liste (15 Min TTL)
- `blog:post:{slug}` - Einzelner Blog-Post (1h TTL)

---

## Sicherheits-Überlegungen

1. **Aktivierungs-Tokens**:
   - Zufällige, sichere Tokens (mindestens 32 Zeichen)
   - Zeitlich begrenzt (7 Tage)
   - Einmalig verwendbar

2. **Passwort-Setup**:
   - Mindestlänge: 8 Zeichen
   - Passwort-Hashing mit bcrypt
   - Rate Limiting für Setup-Versuche

3. **Admin-Authentifizierung**:
   - Bestehendes System nutzen
   - Role-based Access (falls nötig)

4. **Blog-Editor**:
   - XSS-Schutz (Content sanitization)
   - Bild-Upload Validierung
   - Admin-only Zugriff

---

## Testing Checkliste

### AI-Voice: ✅ ABGESCHLOSSEN
- [x] Header zeigt AI-Voice als ersten Link (als "Telefonassistent AI")
- [x] Footer zeigt AI-Voice Link (als "Telefonassistent AI")
- [x] Alle 3 Pakete buchbar (Mini Job, Midi Job, Festangestellt)
- [x] Einrichtungspaket als Add-on oder separat (Checkbox bei Hauptpaketen, separater Button)
- [x] Stripe Checkout funktioniert (API Route erstellt und getestet)
- [x] Webhook speichert Buchung korrekt (erweitert für AI-Voice Pakete)
- [x] FAQ-Bereich ist klappbar (Accordion-Implementierung erstellt)

### E-Mail-System:
- [x] SMTP-Verbindung funktioniert ✅ (Test-E-Mail erfolgreich)
- [ ] Bestellbestätigung wird nach echter Bestellung gesendet
- [ ] Aktivierungs-E-Mail wird gesendet
- [ ] Token ist gültig und funktioniert
- [ ] Passwort-Setup funktioniert
- [ ] Login mit neuem Passwort funktioniert

### Admin-Portal:
- [ ] Alle Tabs funktionieren
- [ ] Kunden-Liste zeigt korrekte Daten
- [ ] Rechnungen werden angezeigt
- [ ] Blog-Editor speichert Artikel
- [ ] Artikel erscheinen im Blog
- [ ] Artikel können bearbeitet/gelöscht werden

---

## Notizen und Offene Fragen

### Offene Fragen:
1. ~~AI-Voice: Monatlich oder auch jährlich?~~ ✅ **GELÖST**: Nur monatlich für Hauptpakete, Einrichtungspaket einmalig
2. ~~AI-Voice: Einrichtungspaket als Checkbox oder separater Button?~~ ✅ **GELÖST**: Beides - Checkbox bei Hauptpaketen, separater Button für direkten Kauf
3. ~~E-Mail: Wie lange Aktivierungs-Link gültig?~~ ✅ **GELÖST**: 7 Tage (empfohlen, im Plan festgelegt)
4. ~~Blog: Welche WYSIWYG-Bibliothek?~~ ✅ **GELÖST**: React Quill (im Plan festgelegt)
5. ~~Blog: Bild-Upload oder nur URLs?~~ ✅ **GELÖST**: Zuerst URLs, später optional Upload-Funktion

### Entscheidungen getroffen:
- ✅ Aktivierungs-Link Gültigkeit: **7 Tage**
- ✅ Passwort-Anforderungen: **Mindestens 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen**
- ✅ WYSIWYG-Bibliothek: **React Quill**
- ✅ Bild-Upload: **Zuerst URLs, später optional Upload**
- ✅ Artikel-Preview: **Ja, in Editor integriert**
- ✅ Versionierung: **Nicht in Phase 3, später optional**
- ✅ Kündigungslogik: **Berechnung im Backend** (sicherer)

### Besondere Anforderungen:
- ✅ AI-Voice muss im Header als ERSTES erscheinen - **ERLEDIGT** (als "Telefonassistent AI")
- Kündigungslogik: 24 Monate (monthly) / 2 Jahre (yearly) Vertrag
- Blog-Artikel sollen sofort nach Veröffentlichung im Blog erscheinen

---

## Geschätzte Implementierungszeit

- **Aufgabe 1 (AI-Voice)**: ✅ **ABGESCHLOSSEN** (ca. 4-6 Stunden geschätzt, tatsächlich umgesetzt)
- **Aufgabe 2 (E-Mail-System)**: **4-5 Stunden** (geschätzt, detailliert geplant)
  - Datenbank-Schema: 30 Min
  - Token-System: 1 Stunde
  - E-Mail-Templates: 1 Stunde
  - Frontend + API Routes: 1.5 Stunden
  - Webhook-Integration: 30 Min
  - Testing: 1 Stunde
- **Aufgabe 3 (Admin-Portal)**: **7-9 Stunden** (geschätzt, detailliert geplant)
  - Tab-Navigation: 1 Stunde
  - Kunden-Übersicht: 2 Stunden
  - Rechnungen: 1.5 Stunden
  - Blog-Editor: 3 Stunden
  - Blog-Seite dynamisch: 1.5 Stunden
  - Testing: 1 Stunde

**Gesamt**: ~15-20 Stunden (Phase 1 abgeschlossen ✅, Phase 2 & 3 detailliert geplant 📋)

---

## Zusammenfassung der Planung

### Phase 2: E-Mail-System
**Ziel**: Automatische E-Mails nach Kauf + Portal-Aktivierung

**Kernkomponenten**:
1. ✅ Bestellbestätigung für alle Pakettypen (Webdesign, KI, AI-Voice)
2. ✅ Portal-Aktivierungs-Token-System (PostgreSQL + Redis Cache)
3. ✅ Aktivierungs-E-Mail mit professionellem Design
4. ✅ Passwort-Setup-Seite (`/customer/activate`)
5. ✅ Webhook-Integration mit Duplikat-Prävention (Redis)

**Redis-Integration**:
- Token-Caching für schnellere Validierung
- E-Mail-Duplikat-Prävention (`email_sent:{session_id}`)

### Phase 3: Admin-Portal
**Ziel**: Vollständige Verwaltung von Bestellungen, Kunden, Rechnungen und Blog

**Kernkomponenten**:
1. ✅ Tab-Navigation (4 Tabs: Bestellungen, Kunden, Rechnungen, Blog)
2. ✅ Kunden-Übersicht mit Statistiken (Anzahl Bestellungen, Umsatz, etc.)
3. ✅ Rechnungen-Verwaltung (Synchronisation mit Stripe)
4. ✅ Blog-Editor mit WYSIWYG (React Quill)
5. ✅ Dynamische Blog-Seite (aus Datenbank, mit Caching)

**Redis-Integration**:
- Query Caching für Admin-Dashboard (5-10 Min TTL)
- Cache-Invalidierung bei Änderungen
- Public Blog-Caching (15 Min TTL)

**Technologien**:
- React Quill für WYSIWYG Editor
- Stripe API für Rechnungen
- PostgreSQL für Datenpersistenz
- Redis für Performance-Optimierung

---

**Ende des Plans**

Möchten Sie mit einer bestimmten Aufgabe beginnen, oder haben Sie Fragen/Änderungswünsche zu diesem Plan?

