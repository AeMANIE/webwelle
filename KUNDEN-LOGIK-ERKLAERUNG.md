# 📋 Kunden-Logik Erklärung - WebWelle Projekt

## 🎯 Aktuelle Logik - Zwei Wege

### ✅ Weg 1: Registrierung → Login → Buchung über Stripe

**Ablauf:**
1. **Registrierung** (`/register`)
   - Kunde füllt Formular aus (E-Mail, Passwort, Name, etc.)
   - Kunde wird in `customers` Tabelle erstellt:
     - `is_verified: true` ✅
     - `portal_activated: true` ✅
     - `password_hash` wird gespeichert ✅
   - Kunde erhält JWT-Token
   - Weiterleitung zu `/customer`

2. **Login** (`/customer/login`)
   - Kunde gibt E-Mail + Passwort ein
   - System prüft Passwort aus Datenbank
   - TAN wird generiert und per E-Mail gesendet
   - Kunde gibt TAN ein
   - Login erfolgreich → Weiterleitung zu `/customer`

3. **Buchung über Stripe**
   - Kunde sieht Produkte im Portal
   - Kunde bucht über Stripe Checkout
   - Stripe Webhook wird ausgelöst
   - Buchung wird in `webwelle_bookings` gespeichert
   - **Verknüpfung:** `customer_id` wird gesetzt (weil Kunde bereits existiert)

4. **Kundenportal** (`/customer`)
   - Kunde sieht alle Buchungen
   - Kunde sieht Rechnungen
   - Kunde sieht Abonnements

---

### ✅ Weg 2: Buchung über Stripe → Portal-Aktivierung → Login

**Ablauf:**
1. **Buchung über Stripe** (ohne Registrierung)
   - Kunde bucht direkt über Stripe Checkout
   - Kunde zahlt bei Stripe

2. **Stripe Webhook** (`checkout.session.completed`)
   - `handleCheckoutSessionCompleted` wird aufgerufen
   - Kunde wird in DB erstellt via `getOrCreateCustomerWithNumber`:
     - **WICHTIG:** Kein `password_hash` wird gesetzt! ❌
     - `portal_activated: false` ❌
   - Buchung wird in `webwelle_bookings` gespeichert
   - Portal-Aktivierungs-Token wird generiert
   - E-Mail mit Aktivierungs-Link wird gesendet

3. **Portal-Aktivierung** (`/customer/activate?token=...`)
   - Kunde klickt auf Link in E-Mail
   - Kunde setzt Passwort
   - `password_hash` wird gespeichert ✅
   - `portal_activated: true` wird gesetzt ✅
   - Token wird als verwendet markiert

4. **Login** (`/customer/login`)
   - Kunde gibt E-Mail + Passwort ein
   - System prüft Passwort aus Datenbank
   - TAN wird generiert und per E-Mail gesendet
   - Kunde gibt TAN ein
   - Login erfolgreich → Weiterleitung zu `/customer`

5. **Kundenportal** (`/customer`)
   - Kunde sieht alle Buchungen
   - Kunde sieht Rechnungen
   - Kunde sieht Abonnements

---

## 📊 Datenquellen

### Kunden-Daten:
- **Tabelle:** `customers`
- **Wichtigste Felder:**
  - `id` (UUID) - Eindeutige Kunden-ID
  - `email` (VARCHAR) - E-Mail-Adresse (UNIQUE)
  - `password_hash` (VARCHAR) - Gehashtes Passwort
  - `name` (VARCHAR) - Name des Kunden
  - `customer_number` (VARCHAR) - Format: WEB-YYYY-NNNNN
  - `is_verified` (BOOLEAN) - Ist Kunde verifiziert?
  - `portal_activated` (BOOLEAN) - Ist Portal aktiviert?

### Buchungen:
- **Tabelle:** `webwelle_bookings`
- **Verknüpfung zu Kunden:**
  - `customer_id` (UUID) - Foreign Key zu `customers.id`
  - `customer_email` (VARCHAR) - E-Mail-Adresse (Fallback)
- **Wichtigste Felder:**
  - `id` (UUID) - Eindeutige Buchungs-ID
  - `package_type` - Art des Pakets
  - `status` - Status (pending, paid, failed, cancelled)
  - `total_amount_cents` - Gesamtbetrag in Cent
  - `stripe_customer_id` - Stripe Customer ID
  - `stripe_payment_intent_id` - Stripe Payment Intent ID
  - `stripe_subscription_id` - Stripe Subscription ID

### Rechnungen:
- **Tabelle:** `invoices` (oder `webwelle_invoices`)
- **Verknüpfung zu Kunden:**
  - `customer_id` (UUID) - Foreign Key zu `customers.id`
  - `customer_email` (VARCHAR) - E-Mail-Adresse (Fallback)
- **Wichtigste Felder:**
  - `id` (UUID) - Eindeutige Rechnungs-ID
  - `invoice_number` - Rechnungsnummer
  - `amount_cents` - Betrag in Cent
  - `status` - Status (draft, sent, paid, overdue, cancelled)
  - `pdf_url` - Link zum PDF
  - `stripe_invoice_id` - Stripe Invoice ID

---

## 🔍 Woher kommen die Kunden-Daten?

### Im Kundenportal (`/customer`):
- **✅ FERTIG:** `/api/customer-portal` verwendet jetzt **PostgreSQL** ✅
- Lädt Daten direkt aus PostgreSQL (wie Admin-Dashboard)
- Unterstützt beide Wege: `customer_id` (registriert) oder `customer_email` (über Stripe gebucht)

### Im Admin-Dashboard (`/admin`):
- **Aktuell:** `/api/admin/customers` verwendet **PostgreSQL** ✅
- Lädt alle Kunden aus `customers` Tabelle
- Zeigt Buchungen, Rechnungen, Abonnements

---

## ✅ Behobene Probleme

### ✅ Problem 1: Kundenportal verwendet jetzt PostgreSQL
- **Vorher:** `/api/customer-portal` verwendete Directus ❌
- **Jetzt:** Direkt aus PostgreSQL laden ✅
- **Vorteil:** Konsistenz mit Admin-Dashboard, keine Abhängigkeit von Directus

### ✅ Problem 2: Verknüpfung Buchung ↔ Kunde verbessert
- **Vorher:** Buchungen wurden nur über `customer_email` verknüpft
- **Jetzt:** Im Webhook wird `customer_id` gesetzt, wenn Kunde bereits existiert ✅
- **Vorteil:** Beide Wege funktionieren korrekt:
  - **Weg 1:** Registrierung → Buchung → `customer_id` wird gesetzt
  - **Weg 2:** Buchung → Aktivierung → `customer_email` wird verwendet

### ✅ Problem 3: `getOrCreateCustomerWithNumber` erstellt Kunden OHNE Passwort
- **Aktuell:** Wenn Kunde über Stripe bucht, wird Kunde ohne `password_hash` erstellt
- **OK:** So ist es gedacht (Portal-Aktivierung erforderlich)
- **Funktioniert:** Kunde kann sich nach Portal-Aktivierung einloggen ✅

---

## 🎯 Empfohlene Logik (Verbesserung)

### Szenario 1: Registrierung → Buchung
1. Kunde registriert sich → Konto erstellt mit Passwort
2. Kunde bucht → `customer_id` wird in Buchung gesetzt
3. Kunde sieht sofort alle Infos

### Szenario 2: Buchung → Aktivierung
1. Kunde bucht → Konto OHNE Passwort erstellt
2. Aktivierungs-E-Mail wird gesendet
3. Kunde aktiviert Portal → Passwort wird gesetzt
4. Kunde kann sich einloggen

---

## 📁 Wichtige Dateien

### Registrierung & Login:
- `/api/auth/register` - Kundenregistrierung
- `/api/auth/request-tan` - TAN anfordern
- `/api/auth/verify-tan` - TAN verifizieren
- `/api/customer/activate-portal` - Portal aktivieren

### Stripe:
- `/api/stripe/webhook` - Stripe Webhook Handler
- `/api/stripe/create-checkout-session` - Checkout Session erstellen

### Kundenportal:
- `/api/customer-portal` - Kundenportal API (verwendet Directus - sollte PostgreSQL verwenden)
- `/customer/page.tsx` - Kundenportal UI

### Admin:
- `/api/admin/customers` - Alle Kunden laden (PostgreSQL)
- `/api/admin/customers/[id]` - Kunden-Details (PostgreSQL)

---

## ✅ Was wurde geändert?

1. **✅ Kundenportal API auf PostgreSQL umgestellt**
   - `/api/customer-portal` lädt jetzt direkt aus PostgreSQL
   - Nicht mehr Directus verwenden
   - Unterstützt beide Wege: `customer_id` oder `customer_email`

2. **✅ Verknüpfung Buchung ↔ Kunde verbessert**
   - Im Webhook: `customer_id` wird gesetzt, wenn Kunde existiert
   - Beide Wege funktionieren jetzt korrekt

3. **✅ Konsistenz zwischen Admin und Kundenportal**
   - Beide verwenden jetzt dieselbe Datenquelle (PostgreSQL)
   - Gleiche Logik für beide Portale

## 🎯 Beide Wege funktionieren jetzt:

### ✅ Weg 1: Registrierung → Login → Buchung
- Kunde registriert sich → Konto mit Passwort erstellt
- Kunde bucht → `customer_id` wird in Buchung gesetzt ✅
- Kunde sieht sofort alle Infos im Portal

### ✅ Weg 2: Buchung → Aktivierung → Login
- Kunde bucht → Konto OHNE Passwort erstellt
- Aktivierungs-E-Mail wird gesendet
- Kunde aktiviert Portal → Passwort wird gesetzt
- Kunde kann sich einloggen und sieht alle Infos im Portal

