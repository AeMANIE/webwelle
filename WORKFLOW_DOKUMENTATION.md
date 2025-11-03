# WebWelle - Workflow-Dokumentation
## Vollständige Übersicht aller Prozesse und verwendeten Dateien

---

## WORKFLOW 1: Kunde bucht Paket/Zusatzpaket → Stripe-Zahlung → Bestätigung

### 1.1 Frontend: Kunde wählt Paket aus
**Dateien:**
- `src/app/buchung/[package]/page.tsx` (z.B. `/buchung/starterwelle`)
- `src/app/components/StripeCheckout.tsx`
- `src/app/ai-voice/page.tsx` (für AI-Voice Pakete)
- `src/app/ai-agent/page.tsx` (für KI-Pakete)

**Ablauf:**
1. Kunde füllt Formular aus (Name, E-Mail, etc.)
2. Frontend ruft Checkout-Session-API auf
3. Redirect zu Stripe Checkout

---

### 1.2 Checkout-Session erstellen (JE NACH PAKET-TYP)

#### A) Webdesign-Pakete (StarterWelle, BusinessWelle, ErfolgsWelle)
**Datei:** `src/app/api/stripe/create-checkout-session/route.ts`

**Ablauf:**
1. POST `/api/stripe/create-checkout-session`
2. Validierung: Nur Webdesign-Pakete erlaubt
3. Stripe Checkout Session erstellen mit:
   - `mode: 'subscription'` (immer subscription für monthly/yearly)
   - Line Items: Hauptpaket + Add-ons (kompatible)
   - Metadata: packageType, isMonthly, customerName, formData, addOnPriceIds
   - `success_url`: `/success?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `/buchung/{packageType}?cancelled=true`
4. **Buchung als "pending" in DB speichern:**
   - `src/lib/database.ts` → `saveBooking(bookingData)`
   - Speichert in Tabelle `webwelle_bookings`
   - Status: `'pending'`
5. Return: `{ sessionId: session.id }`
6. Frontend redirectet zu Stripe Checkout

**Verwendete Dateien:**
- `src/app/api/stripe/create-checkout-session/route.ts` (Hauptroute)
- `src/lib/database.ts` (saveBooking, pool.connect)
- `src/lib/stripe.ts` (optional, Stripe-Utils)

---

#### B) KI-Pakete (FlowWelle, PowerWelle, MeisterWelle)
**Datei:** `src/app/api/stripe/create-ki-checkout-session/route.ts`

**Ablauf:**
1. POST `/api/stripe/create-ki-checkout-session`
2. Validierung: Nur KI-Pakete erlaubt
3. Stripe Checkout Session erstellen (vereinfacht, keine Add-ons)
4. Buchung als "pending" speichern
5. Return: `{ sessionId }`

**Verwendete Dateien:**
- `src/app/api/stripe/create-ki-checkout-session/route.ts`
- `src/lib/database.ts` (saveBooking)

---

#### C) AI-Voice Pakete (MiniJob, MidiJob, Festangestellt)
**Datei:** `src/app/api/stripe/create-ai-voice-checkout-session/route.ts`

**Ablauf:**
1. POST `/api/stripe/create-ai-voice-checkout-session`
2. Validierung: AI-Voice Pakete
3. Session erstellen mit Hauptpaket + Einrichtungspaket (wenn gewählt)
4. Buchung als "pending" speichern
5. Return: `{ sessionId }`

**Verwendete Dateien:**
- `src/app/api/stripe/create-ai-voice-checkout-session/route.ts`
- `src/lib/database.ts` (saveBooking)

---

#### D) Add-on Bestellung (Zusatzpakete nach Hauptbuchung)
**Datei:** `src/app/api/addon-checkout/route.ts`

**Ablauf:**
1. POST `/api/addon-checkout`
2. Erstellt separate Checkout Session für Add-on
3. Verknüpft mit bestehender Booking-ID
4. Return: `{ sessionId }`

**Verwendete Dateien:**
- `src/app/api/addon-checkout/route.ts`
- `src/lib/database.ts` (saveBooking)

---

### 1.3 Kunde zahlt bei Stripe
**Extern:** Stripe Checkout Formular
- Kunde gibt Zahlungsdaten ein
- Stripe validiert Zahlung
- Bei Erfolg: Redirect zu `/success?session_id=cs_...`

---

### 1.4 Stripe sendet Webhook Event (checkout.session.completed)
**Datei:** `src/app/api/stripe/webhook/route.ts`

**Ablauf:**
1. POST `/api/stripe/webhook`
2. **Signatur-Verifikation:**
   - Prüft `stripe-signature` Header
   - Verwendet `STRIPE_WEBHOOK_SECRET`
   - Konstruiert Event mit `stripe.webhooks.constructEvent()`
3. **Event-Routing:** Switch/Case für Event-Typen
4. Für `checkout.session.completed`: Ruft `handleCheckoutSessionCompleted()` auf

---

### 1.5 handleCheckoutSessionCompleted() - DIE ZENTRALE FUNKTION
**Datei:** `src/app/api/stripe/webhook/route.ts` (ab Zeile 87)

**Ablauf:**
1. **Metadata extrahieren:**
   - `packageType`, `isMonthly`, `customerName`, `formData`, `addOnPriceIds`
2. **Kunde erstellen/abrufen mit Kundennummer:**
   - `src/lib/database.ts` → `getOrCreateCustomerWithNumber()`
   - Erstellt/aktualisiert Eintrag in `customers` Tabelle
   - Generiert Kundennummer `WEB-YYYY-NNNNN` (falls neu)
3. **Buchung final speichern/aktualisieren:**
   - `src/lib/database.ts` → `saveBooking(bookingData)`
   - Status: `'paid'`
   - Speichert: session_id, package_type, customer_email, total_amount_cents, etc.
   - Tabelle: `webwelle_bookings`
4. **E-Mails senden:**
   - Ruft `sendBookingAndActivationEmails()` auf (Zeile 232)

---

### 1.6 sendBookingAndActivationEmails() - E-MAIL-VERSAND
**Datei:** `src/app/api/stripe/webhook/route.ts` (ab Zeile 232)

**Ablauf:**
1. **Prüft ob E-Mail bereits gesendet (Redis-Deduplizierung):**
   - `src/lib/redis.ts` → `getRedisClient()`
   - Key: `email_sent:{session_id}`
   - TTL: 24 Stunden
   - Wenn vorhanden → überspringe (verhindert Duplikate)
2. **Bestellbestätigungs-E-Mail:**
   - **Datei:** `src/lib/email-helpers.ts` → `sendBookingConfirmationEmail()`
   - Ruft `src/lib/email.ts` → `sendEmail()` auf
   - SMTP: `smtp.hostinger.com:465`
   - Env-Vars: `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASSWORD`
   - Template: HTML mit Paket-Details
3. **Portal-Aktivierungs-E-Mail (nur bei Erstkauf):**
   - Prüft: `customer.portal_activated === false`
   - **Datei:** `src/lib/portal-activation.ts` → `generatePortalActivationToken()`
   - Erstellt Token (crypto.randomBytes)
   - Speichert in DB: `customer_portal_tokens` (email, token, expires_at)
   - Speichert in Redis: `portal_token:{token}` (TTL 7 Tage)
   - **Datei:** `src/lib/email-portal-activation.ts` → `sendPortalActivationEmail()`
   - Ruft `src/lib/email.ts` → `sendEmail()` auf
   - Link: `https://webwelle.com/customer/activate?token={token}`
4. **Redis-Deduplizierung setzen:**
   - Setzt `email_sent:{session_id}` (TTL 24h)
5. **Bei Fehler:** Loggt Fehler, wirft NICHT (damit Stripe 200 erhält)

**Verwendete Dateien:**
- `src/app/api/stripe/webhook/route.ts` (sendBookingAndActivationEmails)
- `src/lib/email.ts` (sendEmail, getTransporter, nodemailer)
- `src/lib/email-helpers.ts` (sendBookingConfirmationEmail, Template)
- `src/lib/email-portal-activation.ts` (sendPortalActivationEmail, Template)
- `src/lib/portal-activation.ts` (generatePortalActivationToken)
- `src/lib/database.ts` (getOrCreateCustomerWithNumber, savePortalToken)
- `src/lib/redis.ts` (getRedisClient, email_sent Cache)

---

### 1.7 Rechnung automatisch senden (invoice.payment_succeeded Event)
**Datei:** `src/app/api/stripe/webhook/route.ts` → `handleInvoicePaymentSucceeded()` (ab Zeile 324)

**Ablauf:**
1. Stripe sendet `invoice.payment_succeeded` Event
2. **Invoice-Details abrufen:**
   - `stripe.invoices.retrieve(invoice.id)`
   - Expandiert: customer, lines.data.price.product
3. **Kundennummer abrufen:**
   - `src/lib/database.ts` → `getCustomerByEmail()`
   - Holt `customer_number` aus `customers` Tabelle
4. **Rechnung in DB speichern:**
   - `src/lib/database.ts` → `saveInvoice()`
   - Tabelle: `invoices`
   - Felder: stripe_invoice_id, invoice_number, customer_email, customer_number, amount_cents, status, paid_at, etc.
   - Issuer: `'Stripe'`
5. **Branded PDF generieren:**
   - `src/lib/invoice-pdf.ts` → `generateInvoicePdf()`
   - Bibliothek: `pdfkit`
   - Enthält: Firmendaten (AeManie GmbH), Kundennummer, MwSt 19%, etc.
6. **PDF per E-Mail senden:**
   - `src/lib/email.ts` → `sendEmail()` mit `attachments` Array
   - PDF als Attachment
   - Innerhalb 1 Minute nach Zahlung

**Verwendete Dateien:**
- `src/app/api/stripe/webhook/route.ts` (handleInvoicePaymentSucceeded)
- `src/lib/database.ts` (getCustomerByEmail, saveInvoice)
- `src/lib/invoice-pdf.ts` (generateInvoicePdf, pdfkit)
- `src/lib/email.ts` (sendEmail mit attachments)

---

### 1.8 Success-Seite
**Datei:** `src/app/success/page.tsx`

**Ablauf:**
1. Kunde wird zu `/success?session_id=cs_...` redirectet
2. Frontend zeigt Bestätigung
3. Optional: Button "Zum Kundenportal"

---

## WORKFLOW 2: Admin einloggen → Bestellungen/Rechnungen/Kunden sehen

### 2.1 Admin-Login
**Frontend:** `src/app/admin/login/page.tsx`

**Ablauf:**
1. Admin gibt E-Mail/Passwort ein
2. POST `/api/auth/admin-login`
3. **Datei:** `src/app/api/auth/admin-login/route.ts`

---

### 2.2 Admin-Login Authentifizierung
**Datei:** `src/app/api/auth/admin-login/route.ts`

**Ablauf:**
1. Empfängt: `{ email, password }`
2. Ruft `src/lib/auth.ts` → `adminLogin(email, password)` auf

---

### 2.3 adminLogin() Funktion
**Datei:** `src/lib/auth.ts` (ab Zeile 91)

**Ablauf:**
1. **Admin-User abrufen:**
   - `getAdminUsers()` (Zeile 27)
   - Liest `ADMIN_EMAIL` aus ENV
   - Falls `ADMIN_PASSWORD_HASH` gesetzt → Hash-Modus
   - Falls `ADMIN_PASSWORD` gesetzt → Klartext-Fallback
2. **E-Mail-Vergleich:** Case-insensitive
3. **Passwort-Verifikation:**
   - Hash: `bcrypt.compare(password, ADMIN_PASSWORD_HASH)`
   - Klartext: `password === ADMIN_PASSWORD`
4. **JWT-Token erstellen:**
   - `createToken(user)` (Zeile 140)
   - `src/lib/auth.ts` → `createToken()`
   - Bibliothek: `jsonwebtoken`
   - Secret: `JWT_SECRET`
   - Payload: `{ id, email, role: 'admin', name }`
   - Expires: 24 Stunden
5. **Return:** `{ user, token }`

---

### 2.4 Cookie setzen & Redirect
**Datei:** `src/app/api/auth/admin-login/route.ts`

**Ablauf:**
1. Setzt HttpOnly Cookie: `auth-token=${token}`
2. Return: `{ success: true, token, user }`
3. Frontend speichert Cookie (falls nötig)
4. Redirect zu `/admin`

---

### 2.5 Middleware prüft Admin-Bereich
**Datei:** `src/middleware.ts`

**Ablauf:**
1. Bei Request zu `/admin/*` (außer `/admin/login`)
2. Liest Cookie: `auth-token`
3. Verifiziert Token: `verifyTokenEdge(token)`
4. Prüft: `payload.role === 'admin'`
5. Falls ungültig → Redirect zu `/admin/login`
6. Falls gültig → Request durchlassen

---

### 2.6 Admin-Dashboard laden
**Datei:** `src/app/admin/page.tsx`

**Ablauf:**
1. Client-Side Component
2. Prüft Cookie: `auth-token`
3. Dekodiert JWT (Client-Side)
4. Zeigt Tabs: Bookings, Customers, Invoices, Blog
5. Lädt initial: `CustomersTab` (Standard)

---

### 2.7 Admin: Kundenliste anzeigen
**Komponente:** `src/app/components/admin/CustomersTab.tsx`

**Ablauf:**
1. useEffect: Lädt `/api/admin/customers`
2. **API-Route:** `src/app/api/admin/customers/route.ts`
3. **Authentifizierung:**
   - Liest Cookie: `auth-token`
   - `src/lib/auth.ts` → `verifyToken(token)`
   - Prüft: `user.role === 'admin'`
4. **Redis-Cache prüfen:**
   - Key: `admin:customers:list`
   - TTL: 5 Minuten (300 Sekunden)
   - Falls vorhanden → Return cached
5. **Datenbank-Query:**
   - `src/lib/database.ts` → `pool.connect()`
   - Query: JOIN `customers` + `webwelle_bookings`
   - Aggregation: COUNT(bookings), SUM(revenue), MAX(last_booking_date)
   - Tabelle: `customers`, `webwelle_bookings`
6. **Cache setzen:** Redis `admin:customers:list` (5 Min)
7. **Return:** JSON Array mit Kunden + Statistiken

**Verwendete Dateien:**
- `src/app/components/admin/CustomersTab.tsx` (UI)
- `src/app/api/admin/customers/route.ts` (API)
- `src/lib/auth.ts` (verifyToken)
- `src/lib/database.ts` (pool, SQL-Query)
- `src/lib/redis.ts` (getRedisClient, Cache)

---

### 2.8 Admin: Kundendetails anzeigen (Details-Button)
**Komponente:** `src/app/components/admin/CustomersTab.tsx`

**Ablauf:**
1. User klickt "Details" Button
2. Fetch: `GET /api/admin/customers/${customer.id}`
3. **API-Route:** `src/app/api/admin/customers/[id]/route.ts`

---

### 2.9 Admin Kundendetails-API
**Datei:** `src/app/api/admin/customers/[id]/route.ts`

**Ablauf:**
1. **Authentifizierung:** verifyToken + admin-Rolle
2. **Kunde aus DB:**
   - `src/lib/database.ts` → `pool.connect()`
   - Query: `SELECT * FROM customers WHERE id = $1`
3. **Buchungen aus DB:**
   - Query: `SELECT * FROM webwelle_bookings WHERE customer_email = $1`
   - Tabelle: `webwelle_bookings`
4. **Stripe-Daten abrufen:**
   - Findet `stripe_customer_id` aus Buchungen
   - `stripe.invoices.list({ customer: stripeCustomerId })`
   - `stripe.subscriptions.list({ customer: stripeCustomerId })`
5. **Return:** `{ customer, bookings, invoices, subscriptions }`

**Verwendete Dateien:**
- `src/app/api/admin/customers/[id]/route.ts`
- `src/lib/database.ts` (pool, SQL)
- Stripe SDK (invoices.list, subscriptions.list)

---

### 2.10 Admin: Rechnungen anzeigen
**Komponente:** `src/app/components/admin/InvoicesTab.tsx`

**Ablauf:**
1. useEffect: Lädt `/api/admin/invoices`
2. **API-Route:** `src/app/api/admin/invoices/route.ts`
3. **Authentifizierung:** verifyToken + admin-Rolle
4. **Redis-Cache:** Key `admin:invoices:list` (10 Min TTL)
5. **Stripe-Daten:**
   - `stripe.invoices.list({ limit: 100, expand: ['data.customer', 'data.subscription'] })`
   - Formatiert: invoiceNumber, customerEmail, amount, status, issuer, etc.
6. **Cache setzen:** Redis (10 Min)
7. **Return:** JSON Array mit Rechnungen

**Verwendete Dateien:**
- `src/app/components/admin/InvoicesTab.tsx` (UI)
- `src/app/api/admin/invoices/route.ts` (API)
- `src/lib/redis.ts` (Cache)
- Stripe SDK

---

### 2.11 Admin: Rechnung als PDF herunterladen
**Komponente:** `src/app/components/admin/InvoicesTab.tsx`

**Ablauf:**
1. User klickt "Branded PDF" Button
2. Link: `/api/admin/invoices/pdf?id={invoiceId}`
3. **API-Route:** `src/app/api/admin/invoices/pdf/route.ts`
4. **Authentifizierung:** verifyToken + admin-Rolle
5. **Stripe Invoice abrufen:**
   - `stripe.invoices.retrieve(invoiceId)`
6. **Kundennummer abrufen:**
   - `src/lib/database.ts` → `getCustomerByEmail()`
7. **Branded PDF generieren:**
   - `src/lib/invoice-pdf.ts` → `generateInvoicePdf()`
   - Enthält: Firmendaten, Kundennummer, MwSt 19%
8. **Return:** PDF als Binary (Content-Type: application/pdf)

**Verwendete Dateien:**
- `src/app/api/admin/invoices/pdf/route.ts`
- `src/lib/invoice-pdf.ts` (generateInvoicePdf)
- `src/lib/database.ts` (getCustomerByEmail)
- Stripe SDK

---

### 2.12 Admin: Rechnung per E-Mail senden (manuell)
**Komponente:** `src/app/components/admin/InvoicesTab.tsx`

**Ablauf:**
1. User klickt "Per E-Mail senden" Button (falls vorhanden)
2. POST `/api/admin/invoices/send-pdf-email`
3. **API-Route:** `src/app/api/admin/invoices/send-pdf-email/route.ts`
4. **Authentifizierung:** verifyToken + admin-Rolle
5. **PDF generieren:** Wie in 2.11
6. **E-Mail senden:**
   - `src/lib/email.ts` → `sendEmail()` mit `attachments: [pdfBuffer]`

**Verwendete Dateien:**
- `src/app/api/admin/invoices/send-pdf-email/route.ts`
- `src/lib/invoice-pdf.ts` (generateInvoicePdf)
- `src/lib/email.ts` (sendEmail mit attachments)

---

## WORKFLOW 3: Admin schreibt Blog-Post

### 3.1 Admin öffnet Blog-Tab
**Komponente:** `src/app/components/admin/BlogTab.tsx`

**Ablauf:**
1. Admin klickt Tab "Blog"
2. useEffect: Lädt `/api/admin/blog`
3. Zeigt Liste aller Blog-Posts

---

### 3.2 Admin: Blog-Liste laden
**API-Route:** `src/app/api/admin/blog/route.ts` (GET)

**Ablauf:**
1. **Authentifizierung:** verifyToken + admin-Rolle
2. **Redis-Cache:** Key `admin:blog:all` oder `admin:blog:{status}` (5 Min)
3. **Datenbank:**
   - `src/lib/blog-database.ts` → `getAllBlogPosts(status)`
   - Query: `SELECT * FROM blog_posts WHERE status = $1` (optional)
   - Tabelle: `blog_posts`
4. **Cache setzen:** Redis (5 Min)
5. **Return:** JSON Array mit Posts

**Verwendete Dateien:**
- `src/app/api/admin/blog/route.ts` (GET)
- `src/lib/blog-database.ts` (getAllBlogPosts)
- `src/lib/database.ts` (pool.connect)
- `src/lib/redis.ts` (Cache)

---

### 3.3 Admin: Neuer Blog-Post erstellen
**Komponente:** `src/app/components/admin/BlogEditor.tsx`

**Ablauf:**
1. Admin klickt "Neuer Artikel"
2. BlogEditor öffnet sich
3. Admin füllt aus: Titel, Slug, Inhalt (React Quill), Tags, etc.
4. Admin klickt "Speichern"
5. POST `/api/admin/blog` (wenn neu) oder PUT `/api/admin/blog/[id]` (wenn bearbeiten)

---

### 3.4 Admin: Blog-Post speichern
**API-Route:** `src/app/api/admin/blog/route.ts` (POST)

**Ablauf:**
1. **Authentifizierung:** verifyToken + admin-Rolle
2. **Validierung:** title, slug, content erforderlich
3. **Datenbank:**
   - `src/lib/blog-database.ts` → `createBlogPost(post)`
   - Query: `INSERT INTO blog_posts (title, slug, content, ...) VALUES (...)`
   - Tabelle: `blog_posts`
   - Status: `'draft'` oder `'published'`
   - Falls `published`: Setzt `published_at = NOW()`
4. **Cache invalidieren:**
   - `admin:blog:all`
   - `admin:blog:draft`
   - `admin:blog:published`
   - `blog:public:list`
5. **Return:** Erstellter Post (JSON)

**Verwendete Dateien:**
- `src/app/api/admin/blog/route.ts` (POST)
- `src/lib/blog-database.ts` (createBlogPost)
- `src/lib/database.ts` (pool.connect)
- `src/lib/redis.ts` (Cache invalidation)

---

### 3.5 Admin: Blog-Post bearbeiten
**API-Route:** `src/app/api/admin/blog/[id]/route.ts` (PUT)

**Ablauf:**
1. **Authentifizierung:** verifyToken + admin-Rolle
2. **Datenbank:**
   - `src/lib/blog-database.ts` → `updateBlogPost(id, updates)`
   - Query: `UPDATE blog_posts SET title = $1, content = $2, ... WHERE id = $N`
3. **Cache invalidieren:** Wie in 3.4
4. **Return:** Aktualisierter Post

**Verwendete Dateien:**
- `src/app/api/admin/blog/[id]/route.ts` (PUT)
- `src/lib/blog-database.ts` (updateBlogPost)

---

### 3.6 Admin: Blog-Post löschen
**API-Route:** `src/app/api/admin/blog/[id]/route.ts` (DELETE)

**Ablauf:**
1. **Authentifizierung:** verifyToken + admin-Rolle
2. **Datenbank:**
   - `src/lib/blog-database.ts` → `deleteBlogPost(id)`
   - Query: `DELETE FROM blog_posts WHERE id = $1`
3. **Cache invalidieren:** Wie in 3.4
4. **Return:** `{ success: true }`

**Verwendete Dateien:**
- `src/app/api/admin/blog/[id]/route.ts` (DELETE)
- `src/lib/blog-database.ts` (deleteBlogPost)

---

### 3.7 Öffentliche Blog-Seite (nach Veröffentlichung)
**Datei:** `src/app/blog/page.tsx`

**Ablauf:**
1. User öffnet `/blog`
2. Server-Side Rendering (SSR)
3. **Datenbank:**
   - `src/lib/blog-database.ts` → `getAllBlogPosts('published')`
   - Query: `SELECT * FROM blog_posts WHERE status = 'published'`
4. **Redis-Cache:** Key `blog:public:list` (15 Min)
5. Zeigt Featured Posts + Regular Posts

**Verwendete Dateien:**
- `src/app/blog/page.tsx` (SSR)
- `src/lib/blog-database.ts` (getAllBlogPosts)
- `src/lib/redis.ts` (Cache)

---

### 3.8 Einzelner Blog-Post (Slug)
**Datei:** `src/app/blog/[slug]/page.tsx`

**Ablauf:**
1. User öffnet `/blog/{slug}`
2. SSR
3. **Datenbank:**
   - `src/lib/blog-database.ts` → `getBlogPostBySlug(slug)`
   - Query: `SELECT * FROM blog_posts WHERE slug = $1`
4. **Redis-Cache:** Key `blog:post:{slug}` (15 Min)
5. Zeigt vollständigen Artikel

**Verwendete Dateien:**
- `src/app/blog/[slug]/page.tsx` (SSR)
- `src/lib/blog-database.ts` (getBlogPostBySlug)

---

## WORKFLOW 4: Kunde loggt ins Kundenportal ein

### 4.1 Kunde öffnet Login-Seite
**Datei:** `src/app/customer/login/page.tsx`

**Ablauf:**
1. Kunde gibt E-Mail/Passwort ein
2. POST `/api/auth/request-tan`

---

### 4.2 TAN anfordern
**API-Route:** `src/app/api/auth/request-tan/route.ts`

**Ablauf:**
1. Empfängt: `{ email, password }`
2. **Kunden-Login prüfen:**
   - `src/lib/auth.ts` → `customerLogin(email, password)`
3. **customerLogin() Funktion:**
   - **Produktion:**
     - `src/lib/database.ts` → `getCustomerByEmail(email)`
     - Prüft `password_hash` aus `customers` Tabelle
     - Verifiziert mit `bcrypt.compare()`
   - **Entwicklung:**
     - Hardcoded Test-Kunden (harmonie_556@yahoo.com, etc.)
4. **TAN generieren:**
   - `src/lib/auth.ts` → `generateTAN()` → 6-stellige Zufallszahl
5. **TAN speichern:**
   - `src/lib/tan-store.ts` → `storeTAN(email, tan)`
   - Redis: Key `tan:{email}`, Value: `{tan, expires}`, TTL: 10 Minuten
6. **TAN per E-Mail senden:**
   - `src/lib/auth.ts` → `requestTAN(email, password)`
   - Ruft `src/lib/email.ts` → `sendEmail()` auf
   - Template: TAN-Code
7. **Return:** `{ success: true, message: 'TAN wurde per E-Mail gesendet', tan: ... }` (Dev: tan in Response)

**Verwendete Dateien:**
- `src/app/api/auth/request-tan/route.ts`
- `src/lib/auth.ts` (customerLogin, requestTAN, generateTAN)
- `src/lib/database.ts` (getCustomerByEmail)
- `src/lib/tan-store.ts` (storeTAN)
- `src/lib/redis.ts` (TAN Storage)
- `src/lib/email.ts` (sendEmail)

---

### 4.3 TAN eingeben & verifizieren
**API-Route:** `src/app/api/auth/verify-tan/route.ts`

**Ablauf:**
1. Empfängt: `{ email, tan }`
2. **TAN validieren:**
   - `src/lib/tan-store.ts` → `verifyTAN(email, tan)`
   - Liest Redis: `tan:{email}`
   - Prüft: TAN korrekt + nicht abgelaufen
3. **Login durchführen:**
   - `src/lib/auth.ts` → `customerLogin2FA(email, tan)`
   - Erstellt JWT-Token
   - Payload: `{ id, email, role: 'customer', name }`
4. **Cookie setzen:**
   - HttpOnly Cookie: `auth-token=${token}`
   - Max-Age: 24 Stunden
5. **Return:** `{ success: true, user }`

**Verwendete Dateien:**
- `src/app/api/auth/verify-tan/route.ts`
- `src/lib/tan-store.ts` (verifyTAN)
- `src/lib/auth.ts` (customerLogin2FA, createToken)
- `src/lib/redis.ts` (TAN Read)

---

### 4.4 Redirect zum Kundenportal
**Datei:** `src/app/customer/page.tsx`

**Ablauf:**
1. Frontend prüft Cookie: `auth-token`
2. Middleware prüft Token (falls `/customer/*`)
3. Lädt Kunden-Daten:
   - GET `/api/customer-portal?action=customer-info`
   - GET `/api/customer-portal?action=bookings`
   - GET `/api/customer-portal?action=subscriptions`

---

### 4.5 Kundenportal-Daten laden
**API-Route:** `src/app/api/customer-portal/route.ts` (GET)

**Ablauf:**
1. **Authentifizierung:**
   - Liest Cookie: `auth-token`
   - `src/lib/auth.ts` → `verifyToken(token)`
   - Prüft: `user.role === 'customer'`
2. **Action-Routing:**
   - `customer-info`: Holt Kundennummer aus DB
   - `bookings`: Holt Buchungen aus DB (webwelle_bookings)
   - `subscriptions`: Holt Abos von Stripe
3. **Return:** JSON mit Daten

**Verwendete Dateien:**
- `src/app/api/customer-portal/route.ts`
- `src/lib/database.ts` (getCustomerByEmail, pool)
- Stripe SDK (subscriptions.list)

---

## WORKFLOW 5: Kunde kündigt Paket/Abonnement

### 5.1 Kunde klickt "Kündigen" im Portal
**Komponente:** `src/app/customer/page.tsx` (cancelSubscription Funktion, Zeile 170)

**Ablauf:**
1. User klickt "Abonnement kündigen" Button
2. POST `/api/customer-portal` mit `action: 'cancel-subscription'`

---

### 5.2 Kündigungs-API
**API-Route:** `src/app/api/customer-portal/route.ts` (POST)

**Ablauf:**
1. **Authentifizierung:** verifyToken + customer-Rolle
2. **Directus-Integration prüfen:**
   - `src/lib/directus.ts` → `isDirectusAvailable()`
   - Prüft: `DIRECTUS_URL` + `DIRECTUS_TOKEN` gesetzt
3. **Subscription kündigen:**
   - `src/lib/directus.ts` → `cancelSubscription(subscriptionId, reason)`
   - Request zu Directus: `PATCH webwelle_subscriptions?filter[stripe_subscription_id][_eq]=${subscriptionId}`
   - Body: `{ customer_cancelled: true, cancellation_reason: reason, cancel_at_period_end: true }`
4. **Return:** `{ success: true, message: 'Abonnement erfolgreich gekündigt' }`

**Verwendete Dateien:**
- `src/app/api/customer-portal/route.ts` (POST)
- `src/lib/directus.ts` (cancelSubscription, isDirectusAvailable)
- Env-Vars: `DIRECTUS_URL`, `DIRECTUS_TOKEN`

**HINWEIS:** Aktuell wird Directus verwendet. Falls Directus nicht verfügbar ist, sollte eine Stripe-Integration hinzugefügt werden:
- `stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })`

---

### 5.3 Stripe sendet subscription.deleted Event (optional)
**Datei:** `src/app/api/stripe/webhook/route.ts` → `handleSubscriptionDeleted()`

**Ablauf:**
1. Stripe sendet `customer.subscription.deleted` Event
2. Handler: `handleSubscriptionDeleted(subscription)`
3. **Aktualisiert Buchung in DB:**
   - `src/lib/database.ts` → `updateBookingStatus(session_id, 'cancelled')`
   - Oder: Neue Tabelle für Subscriptions
4. **Optional: Kündigungs-E-Mail senden**

**Verwendete Dateien:**
- `src/app/api/stripe/webhook/route.ts` (handleSubscriptionDeleted)
- `src/lib/database.ts` (updateBookingStatus)

---

## KRITISCHE ABHÄNGIGKEITEN & POTENTIELLE FEHLERQUELLEN

### Datenbank-Verbindung
**Datei:** `src/lib/database.ts`
- `DATABASE_URL` muss gesetzt sein (PostgreSQL)
- Connection Pool: `new Pool({ connectionString: DATABASE_URL })`
- SSL: `ssl: { rejectUnauthorized: false }`
- **Fehlerquelle:** Wenn DB nicht erreichbar → 500 Fehler auf allen Routen

### Redis-Verbindung
**Datei:** `src/lib/redis.ts`
- `REDIS_URL` muss gesetzt sein
- **Fehlerquelle:** Redis optional, aber ohne Redis:
  - Keine E-Mail-Deduplizierung → Duplikate möglich
  - Kein Cache → Langsamere Antworten
  - Keine TAN-Validierung möglich

### E-Mail-SMTP
**Datei:** `src/lib/email.ts`
- `EMAIL_SMTP_USER` muss gesetzt sein
- `EMAIL_SMTP_PASSWORD` muss gesetzt sein
- SMTP: `smtp.hostinger.com:465`
- **Fehlerquelle:** Wenn SMTP nicht erreichbar → E-Mails werden nicht gesendet (aber Webhook gibt 200)

### Stripe-Konfiguration
**Datei:** `src/app/api/stripe/webhook/route.ts`
- `STRIPE_SECRET_KEY` muss gesetzt sein
- `STRIPE_WEBHOOK_SECRET` muss gesetzt sein (für Signatur-Verifikation)
- **Fehlerquelle:** Wenn Secret falsch → Webhook-Verifikation fehlgeschlagen → 400 Error

### JWT-Secret
**Datei:** `src/lib/auth.ts`
- `JWT_SECRET` muss gesetzt sein
- **Fehlerquelle:** Wenn Secret fehlt → Token können nicht erstellt/verifiziert werden → Login unmöglich

### Admin-Login
**Datei:** `src/lib/auth.ts` → `getAdminUsers()`
- `ADMIN_EMAIL` muss gesetzt sein
- `ADMIN_PASSWORD_HASH` ODER `ADMIN_PASSWORD` muss gesetzt sein
- **Fehlerquelle:** Wenn beide fehlen → Login unmöglich
- **Aktuell:** Klartext-Fallback aktiv (`ADMIN_PASSWORD`)

---

## DATEIEN-ÜBERSICHT NACH FUNKTION

### Authentifizierung & Authorization
- `src/lib/auth.ts` (adminLogin, customerLogin, verifyToken, createToken)
- `src/middleware.ts` (Middleware für /admin und /customer Routes)
- `src/app/api/auth/admin-login/route.ts`
- `src/app/api/auth/customer-login/route.ts`
- `src/app/api/auth/request-tan/route.ts`
- `src/app/api/auth/verify-tan/route.ts`

### Datenbank
- `src/lib/database.ts` (pool, saveBooking, getCustomerByEmail, saveInvoice, getOrCreateCustomerWithNumber, generateCustomerNumber)
- `src/lib/blog-database.ts` (getAllBlogPosts, getBlogPostBySlug, createBlogPost, updateBlogPost, deleteBlogPost)

### E-Mail
- `src/lib/email.ts` (sendEmail, getTransporter, nodemailer)
- `src/lib/email-helpers.ts` (sendBookingConfirmationEmail)
- `src/lib/email-portal-activation.ts` (sendPortalActivationEmail)
- `src/lib/email-addon-confirmation.ts` (sendAddonConfirmationEmail)

### Stripe
- `src/app/api/stripe/create-checkout-session/route.ts` (Webdesign-Pakete)
- `src/app/api/stripe/create-ki-checkout-session/route.ts` (KI-Pakete)
- `src/app/api/stripe/create-ai-voice-checkout-session/route.ts` (AI-Voice)
- `src/app/api/stripe/webhook/route.ts` (checkout.session.completed, invoice.payment_succeeded, etc.)
- `src/lib/stripe.ts` (optional, Stripe-Utils)

### Admin-APIs
- `src/app/api/admin/customers/route.ts` (Kundenliste)
- `src/app/api/admin/customers/[id]/route.ts` (Kundendetails)
- `src/app/api/admin/invoices/route.ts` (Rechnungen)
- `src/app/api/admin/invoices/pdf/route.ts` (PDF-Download)
- `src/app/api/admin/invoices/send-pdf-email/route.ts` (PDF per E-Mail)
- `src/app/api/admin/blog/route.ts` (Blog-Liste + Erstellen)
- `src/app/api/admin/blog/[id]/route.ts` (Blog bearbeiten/löschen)

### Admin-UI
- `src/app/admin/page.tsx` (Dashboard mit Tabs)
- `src/app/admin/login/page.tsx` (Login-Seite)
- `src/app/components/admin/AdminTabs.tsx` (Tab-Navigation)
- `src/app/components/admin/CustomersTab.tsx` (Kundenliste)
- `src/app/components/admin/InvoicesTab.tsx` (Rechnungen)
- `src/app/components/admin/BlogTab.tsx` (Blog-Liste)
- `src/app/components/admin/BlogEditor.tsx` (Blog-Editor mit React Quill)

### Kundenportal
- `src/app/customer/page.tsx` (Kundenportal-Hauptseite)
- `src/app/customer/login/page.tsx` (Login mit 2FA)
- `src/app/customer/activate/page.tsx` (Portal-Aktivierung via Token)
- `src/app/api/customer-portal/route.ts` (Portal-Daten-API)

### Portal-Aktivierung
- `src/lib/portal-activation.ts` (generatePortalActivationToken, validateActivationToken)
- `src/app/api/customer/validate-activation-token/route.ts`
- `src/app/api/customer/activate-portal/route.ts`

### Rechnungen & PDFs
- `src/lib/invoice-pdf.ts` (generateInvoicePdf, pdfkit)
- `src/lib/database.ts` (saveInvoice, InvoiceData)

### Redis & Cache
- `src/lib/redis.ts` (getRedisClient)
- `src/lib/tan-store.ts` (storeTAN, verifyTAN, Redis-basiert)

### Öffentliche Blog-Seiten
- `src/app/blog/page.tsx` (Blog-Liste, SSR)
- `src/app/blog/[slug]/page.tsx` (Einzelner Post, SSR)
- `src/app/api/blog/route.ts` (Public Blog-API)
- `src/app/api/blog/[slug]/route.ts` (Public Post-API)

---

## HÄUFIGE FEHLERQUELLEN

### 1. E-Mails werden nicht gesendet
**Mögliche Ursachen:**
- `EMAIL_SMTP_USER` oder `EMAIL_SMTP_PASSWORD` fehlt/inkorrekt
- Redis-Deduplizierung blockiert (Key `email_sent:{session_id}` vorhanden)
- SMTP-Server (smtp.hostinger.com) nicht erreichbar
- `customer_email` fehlt in Stripe Session

**Debug:**
- `GET /api/debug-email-status` (zeigt Redis + SMTP-Status)
- `GET /api/test-email-simple?to=test@example.com` (Test-E-Mail)
- `GET /api/test-smtp-connection` (SMTP-Verbindung testen)

---

### 2. Admin-Login funktioniert nicht
**Mögliche Ursachen:**
- `ADMIN_EMAIL` fehlt/inkorrekt
- `ADMIN_PASSWORD_HASH` fehlt/inkorrekt (Hash-Truncation durch Shell)
- `ADMIN_PASSWORD` (Klartext) fehlt/inkorrekt
- `JWT_SECRET` fehlt
- Cookie wird nicht gesetzt (Secure-Flag in Production)

**Debug:**
- `GET /api/debug-admin-auth` (zeigt Konfiguration)
- `POST /api/test-admin-login` mit Body: `{email, password}` (detailliertes Logging)

---

### 3. Blog-Seite gibt 500 Fehler
**Mögliche Ursachen:**
- Datenbank-Verbindung fehlt (`DATABASE_URL`)
- Tabelle `blog_posts` existiert nicht
- Redis-Fehler (try-catch sollte das abfangen, aber prüfen)

**Debug:**
- Prüfe Server-Logs (Container-Logs in Coolify)
- Prüfe `DATABASE_URL` in ENV
- Führe Migration aus: `GET /api/migrate` (erstellt Tabellen)

---

### 4. Kunde erhält keine Portal-Aktivierungs-E-Mail
**Mögliche Ursachen:**
- `customer.portal_activated === true` (bereits aktiviert, keine zweite E-Mail)
- E-Mail-Fehler (siehe 1.)
- Token-Generierung fehlgeschlagen
- Redis/DB-Fehler beim Speichern des Tokens

**Debug:**
- Prüfe in DB: `SELECT * FROM customer_portal_tokens WHERE customer_email = '...'`
- Prüfe Redis: Key `portal_token:{token}`

---

### 5. Rechnung wird nicht automatisch gesendet
**Mögliche Ursachen:**
- `invoice.payment_succeeded` Event kommt nicht an
- Webhook-Endpunkt nicht korrekt konfiguriert in Stripe
- `STRIPE_WEBHOOK_SECRET` falsch → Verifikation fehlgeschlagen
- PDF-Generierung fehlgeschlagen (pdfkit-Fehler)
- E-Mail-Versand fehlgeschlagen (siehe 1.)

**Debug:**
- Prüfe Stripe Dashboard → Webhooks → Events
- Prüfe Server-Logs für `invoice.payment_succeeded` Handler

---

## ENVIRONMENT-VARIABLEN CHECKLIST

### Erforderlich für Produktion:
- ✅ `DATABASE_URL` (PostgreSQL)
- ✅ `REDIS_URL` (Redis)
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `EMAIL_SMTP_USER`
- ✅ `EMAIL_SMTP_PASSWORD`
- ✅ `JWT_SECRET`
- ✅ `ADMIN_EMAIL`
- ✅ `ADMIN_PASSWORD_HASH` ODER `ADMIN_PASSWORD`
- ✅ `NEXT_PUBLIC_BASE_URL` (https://webwelle.com)

### Optional:
- `DIRECTUS_URL` (für Subscription-Management)
- `DIRECTUS_TOKEN` (für Subscription-Management)
- `ALLOW_DEBUG_ROUTES` (für Debug-Routes)

---

**Erstellt:** 2025-11-03
**Stand:** Nach 8 Wochen Entwicklung - Vollständige Workflow-Dokumentation


