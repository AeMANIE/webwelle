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

#### 1.4.1 Header Integration
```typescript
// In Header.tsx - Desktop Navigation (Zeile ~51)
<nav className="hidden md:flex space-x-6">
  <Link href="/ai-voice" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">
    AI-Voice
  </Link>
  <Link href="/#vorteile" ...>
    Webdesign-Pakete
  </Link>
  // ... rest
</nav>

// Mobile Navigation (Zeile ~109)
<Link href="/ai-voice" className="block px-3 py-2 ..." onClick={closeMenu}>
  AI-Voice
</Link>
```

#### 1.4.2 Footer Integration
```typescript
// In Footer.tsx - Leistungen Sektion (Zeile ~78)
<ul className="space-y-2">
  <li><Link href="/ai-voice" className="...">AI-Voice</Link></li>
  <li><Link href={{ pathname: '/', hash: 'produkte' }} ...>Webdesign</Link></li>
  // ... rest
</ul>
```

#### 1.4.3 Stripe Konfiguration
```typescript
// In src/lib/stripe.ts
export const AI_VOICE_PRICE_CONFIG = {
  minijob: {
    monthly: {
      priceId: 'price_1SOvxnQoIwTqROaypfI6ff58',
      amount: 39900, // 399€
      currency: 'eur'
    }
  },
  midijob: {
    monthly: {
      priceId: 'price_1SOvyiQoIwTqROaySSNqaqqE',
      amount: 99900, // 999€
      currency: 'eur'
    }
  },
  festangestellt: {
    monthly: {
      priceId: 'price_1SOvzoQoIwTqROayU9iql5tr',
      amount: 199900, // 1999€
      currency: 'eur'
    }
  },
  einrichtungspaket: {
    oneTime: {
      priceId: 'price_1SOyytQoIwTqROayNXuZIxWy',
      amount: 149900, // 1499€
      currency: 'eur'
    }
  }
} as const;
```

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
1. **Bestellbestätigung** - sofort nach erfolgreicher Zahlung
2. **Kundenportal-Aktivierung** - mit Link zum Passwort-Setup und Login

### 2.2 Bestehende E-Mail-Funktionen
- `src/lib/email-confirmation.ts` - existiert bereits für Webdesign-Pakete
- `src/lib/email.ts` - generische E-Mail-Funktion
- Wird im Stripe Webhook aufgerufen

### 2.3 Was fehlt/geändert werden muss

#### 2.3.1 Bestellbestätigung erweitern
**Datei**: `src/app/api/stripe/webhook/route.ts`

Aktueller Status:
- Webhook ruft `sendBookingConfirmation()` auf
- Muss für ALLE Pakettypen funktionieren (Webdesign, KI, AI-Voice)

**Änderungen**:
1. Prüfen ob E-Mail bereits gesendet wurde (um Duplikate zu vermeiden)
2. E-Mail-Template für KI-Pakete anpassen
3. E-Mail-Template für AI-Voice Pakete erstellen
4. E-Mail für alle Pakettypen senden

#### 2.3.2 Kundenportal-Aktivierungs-E-Mail
**Neue Datei**: `src/lib/email-portal-activation.ts`

**Funktionalität**:
- Token-basierte Aktivierung (sicher)
- Eindeutiger Link pro Kunde: `/customer/activate?token=XXX`
- Link ist zeitlich begrenzt (z.B. 7 Tage gültig)
- Token wird in Datenbank gespeichert

**E-Mail-Inhalt**:
- Willkommensnachricht
- Erklärung was das Kundenportal ist
- Aktivierungs-Button mit Link
- Hinweis zur Token-Gültigkeit

**Datenbank-Schema**:
```sql
-- Neue Tabelle: customer_portal_tokens
CREATE TABLE IF NOT EXISTS customer_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.3.3 Passwort-Setup Seite
**Neue Datei**: `src/app/customer/activate/page.tsx`

**Funktionalität**:
1. Token validieren (aus URL Parameter)
2. Prüfen ob Token noch gültig und nicht verwendet
3. Formular für Passwort-Setup anzeigen
4. Passwort speichern (gehashed mit bcrypt)
5. Token als verwendet markieren
6. Kunden-Account aktivieren

**Datenbank-Schema erweitern**:
```sql
-- Erweitere customers Tabelle um:
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS portal_activated BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS activation_token VARCHAR(255);
```

#### 2.3.4 Webhook Integration
**Datei**: `src/app/api/stripe/webhook/route.ts`

**Änderungen**:
1. Nach erfolgreicher Buchung:
   - Bestellbestätigung senden (bereits vorhanden)
   - Portal-Aktivierungs-Token generieren
   - Aktivierungs-E-Mail senden

2. Code-Struktur:
```typescript
// Nach saveBooking()
if (bookingData.customer_email) {
  // 1. Bestellbestätigung
  await sendBookingConfirmation({...});
  
  // 2. Portal-Aktivierung
  const activationToken = generateSecureToken();
  await saveActivationToken(bookingData.customer_email, activationToken);
  await sendPortalActivationEmail(bookingData.customer_email, activationToken);
}
```

### 2.4 E-Mail-Templates

#### 2.4.1 Bestellbestätigung
- Verwendet bestehendes Template aus `email-confirmation.ts`
- Muss für alle Pakettypen funktionieren
- Zeigt korrekte Paket-Informationen
- Zeigt Add-ons (wenn vorhanden)
- Zeigt Gesamtbetrag

#### 2.4.2 Portal-Aktivierung
**Neue Datei**: `src/lib/email-portal-activation.ts`

**Template-Inhalt**:
- Professionelles Design (ähnlich wie Bestellbestätigung)
- Willkommensnachricht
- Erklärung des Kundenportals
- Großer Button "Kundenportal aktivieren"
- Link: `${BASE_URL}/customer/activate?token=${token}`
- Gültigkeit: 7 Tage
- Support-Kontakt

### 2.5 Fragen vor der Umsetzung
1. Soll das Kundenportal-Passwort auch für das normale Login verwendet werden, oder separate Accounts?
2. Wie lange soll der Aktivierungslink gültig sein? (Empfehlung: 7 Tage)
3. Soll es eine "Passwort vergessen" Funktion geben?

---

## Aufgabe 3: Admin-Portal Erweiterung

### 3.1 Übersicht
Erweiterung des Admin-Portals um:
1. Bestellungen-Übersicht (alle Kunden)
2. Rechnungen-Verwaltung
3. Gekaufte Pakete pro Kunde
4. Blog-Editor mit WYSIWYG

### 3.2 Bestehende Admin-Struktur
- `src/app/admin/page.tsx` - Hauptseite (zeigt aktuell nur Buchungen)
- `src/app/admin/login/page.tsx` - Admin Login
- `src/app/api/bookings/route.ts` - API für Buchungen

### 3.3 Was erweitert/neu erstellt werden muss

#### 3.3.1 Admin Dashboard Übersicht
**Datei**: `src/app/admin/page.tsx` erweitern

**Neue Features**:
1. **Tabs/Navigation**:
   - 📦 Bestellungen (aktuell)
   - 👥 Kunden
   - 📄 Rechnungen
   - ✍️ Blog-Editor

2. **Kunden-Übersicht** (neuer Tab):
   - Liste aller Kunden mit:
     - Name, E-Mail, Telefon
     - Anzahl Bestellungen
     - Gesamtumsatz
     - Aktive Pakete
     - Letzte Aktivität
   - Filter: Nach Name, E-Mail, Status
   - Sortierung: Nach Datum, Umsatz, etc.

3. **Rechnungen-Übersicht** (neuer Tab):
   - Liste aller Rechnungen (aus Stripe):
     - Rechnungsnummer
     - Kunde
     - Datum
     - Betrag
     - Status (bezahlt, ausstehend, etc.)
     - Download-Link (PDF von Stripe)

4. **Pakete pro Kunde**:
   - In Kunden-Detail-Ansicht:
     - Aktive Subscriptions
     - Gekaufte Pakete
     - Add-ons
     - Kündigungsstatus

#### 3.3.2 Blog-Editor
**Neue Datei**: `src/app/admin/blog/page.tsx`

**Funktionalität**:
1. **WYSIWYG Editor**:
   - Bibliothek: React Quill oder TipTap
   - Features:
     - Textformatierung (fett, kursiv, etc.)
     - Überschriften
     - Listen
     - Links
     - Bilder (Upload)
     - Code-Blöcke
     - Tabellen

2. **Artikel-Verwaltung**:
   - Liste aller Artikel (draft, published)
   - Artikel erstellen/bearbeiten
   - Artikel löschen
   - Status: Entwurf, Veröffentlicht

3. **Artikel-Metadaten**:
   - Titel
   - Slug (URL-freundlich)
   - Excerpt/Kurzbeschreibung
   - Autor
   - Datum
   - Tags
   - Featured (Boolean)
   - Meta Description (SEO)
   - Featured Image

4. **Datenbank-Schema**:
```sql
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author VARCHAR(255) DEFAULT 'SEO-Team WebWelle',
  featured_image_url VARCHAR(500),
  meta_description TEXT,
  tags TEXT[], -- Array of tags
  featured BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft' | 'published'
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID -- Reference to admin user
);
```

5. **API Routes** (neu):
   - `src/app/api/admin/blog/route.ts` - GET (Liste), POST (Erstellen)
   - `src/app/api/admin/blog/[id]/route.ts` - GET (Einzelner), PUT (Update), DELETE

6. **Blog-Seite anpassen**:
   - `src/app/blog/page.tsx` - Daten aus Datenbank statt hardcoded
   - `src/app/blog/[slug]/page.tsx` - Dynamische Route für einzelne Artikel

#### 3.3.3 Kündigungslogik
**Datei**: `src/app/admin/page.tsx` oder neue Datei

**Funktionalität**:
- Anzeige der Kündigungsbedingungen pro Subscription:
  - Monthly: 24 Monate Vertrag, dann monatlich kündbar
  - Yearly: 2 Jahre Vertrag, dann kündbar
- Button "Kündigung anzeigen" in Kunden-Detail
- Status-Anzeige: "Kündbar ab: [Datum]"

**Stripe Integration**:
- Prüfe Subscription-Startdatum
- Berechne Kündigungsdatum
- Zeige in UI an

### 3.4 Admin API Routes erweitern

#### 3.4.1 Kunden-API
**Neue Datei**: `src/app/api/admin/customers/route.ts`
```typescript
// GET: Liste aller Kunden mit Statistiken
// GET ?id=XXX: Einzelner Kunde mit Details
```

#### 3.4.2 Rechnungen-API
**Neue Datei**: `src/app/api/admin/invoices/route.ts`
```typescript
// GET: Liste aller Rechnungen aus Stripe
// Synchronisiert mit Stripe API
```

#### 3.4.3 Blog-API
**Dateien**: 
- `src/app/api/admin/blog/route.ts`
- `src/app/api/admin/blog/[id]/route.ts`

### 3.5 UI-Komponenten

#### 3.5.1 Admin Navigation/Tabs
```typescript
// Tab-Navigation Component
<Tabs>
  <Tab id="bookings" label="Bestellungen" icon={<Package />} />
  <Tab id="customers" label="Kunden" icon={<User />} />
  <Tab id="invoices" label="Rechnungen" icon={<Euro />} />
  <Tab id="blog" label="Blog" icon={<FileText />} />
</Tabs>
```

#### 3.5.2 Blog-Editor Component
```typescript
// src/app/components/admin/BlogEditor.tsx
// WYSIWYG Editor mit:
// - Toolbar
// - Content Area
// - Preview
// - Save/Publish Buttons
```

### 3.6 Fragen vor der Umsetzung
1. Welche WYSIWYG-Bibliothek bevorzugen Sie? (React Quill, TipTap, andere?)
2. Sollen Bilder direkt hochgeladen werden oder nur URLs?
3. Sollen Artikel-Vorschau (Preview) vor Veröffentlichung möglich sein?
4. Brauchen Sie eine Versionierung von Blog-Artikeln (alte Versionen speichern)?

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

### Phase 2: E-Mail-System
1. ✅ Bestellbestätigung für alle Pakettypen
2. ✅ Portal-Aktivierungs-Token System
3. ✅ Aktivierungs-E-Mail Template
4. ✅ Passwort-Setup Seite
5. ✅ Webhook Integration

### Phase 3: Admin-Portal
1. ✅ Admin Navigation/Tabs
2. ✅ Kunden-Übersicht
3. ✅ Rechnungen-Übersicht
4. ✅ Blog-Editor
5. ✅ Blog API Routes
6. ✅ Blog-Seite dynamisch machen

---

## Technische Anforderungen

### Dependencies die eventuell hinzugefügt werden müssen:
1. **WYSIWYG Editor**: 
   - `react-quill` oder `@tiptap/react`
   - `quill` (CSS für react-quill)

2. **Token Generation**:
   - `crypto` (Node.js built-in, für sichere Token)

3. **Password Hashing**:
   - `bcryptjs` (falls nicht vorhanden)

### Datenbank-Migrationen:
1. `customer_portal_tokens` Tabelle
2. `blog_posts` Tabelle
3. `customers` Tabelle erweitern (password_hash, portal_activated)

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
- [ ] Bestellbestätigung wird gesendet
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
3. E-Mail: Wie lange Aktivierungs-Link gültig?
4. Blog: Welche WYSIWYG-Bibliothek?
5. Blog: Bild-Upload oder nur URLs?

### Besondere Anforderungen:
- ✅ AI-Voice muss im Header als ERSTES erscheinen - **ERLEDIGT** (als "Telefonassistent AI")
- Kündigungslogik: 24 Monate (monthly) / 2 Jahre (yearly) Vertrag
- Blog-Artikel sollen sofort nach Veröffentlichung im Blog erscheinen

---

## Geschätzte Implementierungszeit

- **Aufgabe 1 (AI-Voice)**: ✅ **ABGESCHLOSSEN** (ca. 4-6 Stunden geschätzt, tatsächlich umgesetzt)
- **Aufgabe 2 (E-Mail-System)**: 3-4 Stunden (geschätzt)
- **Aufgabe 3 (Admin-Portal)**: 6-8 Stunden (geschätzt)

**Gesamt**: ~13-18 Stunden (Phase 1 abgeschlossen, Phase 2 & 3 ausstehend)

---

**Ende des Plans**

Möchten Sie mit einer bestimmten Aufgabe beginnen, oder haben Sie Fragen/Änderungswünsche zu diesem Plan?

