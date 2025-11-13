# Kunden-Logik im WebWelle Projekt

## Aktuelle Logik - Zwei Wege

### Weg 1: Registrierung → Login → Buchung über Stripe

**Ablauf:**
1. Kunde registriert sich auf `/register`
   - Erstellt Konto in `customers` Tabelle
   - `is_verified: true`
   - `portal_activated: true`
   - `password_hash` wird gespeichert
   - Kunde erhält JWT-Token

2. Kunde kann sich sofort einloggen (`/customer/login`)
   - E-Mail + Passwort → TAN wird gesendet
   - TAN eingeben → Login erfolgreich

3. Kunde kann Produkte sehen und über Stripe buchen
   - Buchung wird in `webwelle_bookings` gespeichert
   - Verknüpfung über `customer_email` oder `customer_id`

4. Kunde sieht alle Infos im Portal (`/customer`)
   - Buchungen
   - Rechnungen
   - Abonnements

### Weg 2: Buchung über Stripe → Portal-Aktivierung → Login

**Ablauf:**
1. Kunde bucht direkt über Stripe (ohne Registrierung)
   - Stripe Checkout Session wird erstellt
   - Kunde zahlt bei Stripe

2. Stripe Webhook (`checkout.session.completed`) wird ausgelöst
   - Kunde wird in DB erstellt via `getOrCreateCustomerWithNumber`
   - **WICHTIG:** Kein `password_hash` wird gesetzt!
   - Buchung wird in `webwelle_bookings` gespeichert
   - Portal-Aktivierungs-Token wird generiert
   - E-Mail mit Aktivierungs-Link wird gesendet

3. Kunde klickt auf Aktivierungs-Link (`/customer/activate?token=...`)
   - Kunde setzt Passwort
   - `password_hash` wird gespeichert
   - `portal_activated: true` wird gesetzt
   - Token wird als verwendet markiert

4. Kunde kann sich jetzt einloggen (`/customer/login`)
   - E-Mail + Passwort → TAN wird gesendet
   - TAN eingeben → Login erfolgreich

5. Kunde sieht alle Infos im Portal (`/customer`)
   - Buchungen
   - Rechnungen
   - Abonnements

## Probleme in der aktuellen Logik

### Problem 1: `getOrCreateCustomerWithNumber` erstellt Kunden OHNE Passwort
- Wenn Kunde über Stripe bucht, wird Kunde ohne `password_hash` erstellt
- Kunde kann sich NICHT einloggen, bis Portal aktiviert ist
- **Lösung:** OK, so ist es gedacht (Portal-Aktivierung)

### Problem 2: Verknüpfung Buchung ↔ Kunde
- Buchungen werden über `customer_email` verknüpft
- `customer_id` wird nur gesetzt, wenn Kunde bereits existiert
- **Problem:** Wenn Kunde sich registriert und dann bucht, sollte `customer_id` gesetzt werden

### Problem 3: Kundenportal lädt Daten
- Aktuell: `/api/customer-portal` verwendet Directus
- Sollte: Direkt aus PostgreSQL laden (wie Admin-Dashboard)

## Datenquellen

### Kunden-Daten:
- **Tabelle:** `customers`
- **Felder:** id, email, password_hash, name, phone, company_name, customer_number, is_verified, portal_activated

### Buchungen:
- **Tabelle:** `webwelle_bookings`
- **Verknüpfung:** `customer_id` (UUID) ODER `customer_email` (VARCHAR)
- **Felder:** id, package_type, status, total_amount_cents, customer_id, customer_email, stripe_customer_id, etc.

### Rechnungen:
- **Tabelle:** `invoices` (oder `webwelle_invoices`)
- **Verknüpfung:** `customer_id` ODER `customer_email`
- **Felder:** id, invoice_number, amount_cents, status, pdf_url, etc.

## Empfohlene Logik (Verbesserung)

### Szenario 1: Registrierung → Buchung
1. Kunde registriert sich → Konto erstellt
2. Kunde bucht → `customer_id` wird in Buchung gesetzt
3. Kunde sieht sofort alle Infos

### Szenario 2: Buchung → Aktivierung
1. Kunde bucht → Konto OHNE Passwort erstellt
2. Aktivierungs-E-Mail wird gesendet
3. Kunde aktiviert Portal → Passwort wird gesetzt
4. Kunde kann sich einloggen

## Aktuelle Dateien

- **Registrierung:** `/api/auth/register`
- **Login:** `/api/auth/request-tan` + `/api/auth/verify-tan`
- **Portal-Aktivierung:** `/api/customer/activate-portal`
- **Stripe Webhook:** `/api/stripe/webhook`
- **Kundenportal:** `/api/customer-portal` (verwendet Directus - sollte PostgreSQL verwenden)
- **Kundenportal UI:** `/customer/page.tsx`

