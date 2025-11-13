# 📋 Registrierungs-Logik - Aktuelle Situation

## 🔍 Aktuelle Logik bei Registrierung

### Was passiert bei der Registrierung?

1. **Kunde füllt Registrierungsformular aus**
   - E-Mail, Passwort, Name, Telefon (optional), Firma (optional)

2. **Validierung**
   - E-Mail-Format wird geprüft
   - Passwort-Stärke wird geprüft
   - Prüfung, ob Kunde bereits existiert

3. **Datenbank-Speicherung**
   - ✅ **ALLE Daten werden in PostgreSQL gespeichert:**
     - `email` (UNIQUE - verhindert Duplikate)
     - `password_hash` (gehashtes Passwort)
     - `name`
     - `phone` (optional)
     - `company_name` (optional)
     - `is_verified: true` ✅ **Kunde ist SOFORT verifiziert**
     - `verification_token` (wird generiert, aber nicht verwendet)
     - `portal_activated: true` ✅ **Portal ist SOFORT aktiviert**
     - `customer_number` (wird automatisch generiert: WEB-YYYY-NNNNN)

4. **E-Mail-Versand**
   - Verifikations-E-Mail wird gesendet (mit Link)
   - **ABER:** Kunde ist bereits verifiziert, E-Mail ist nur informativ

5. **Login möglich**
   - Kunde kann sich SOFORT einloggen (ohne E-Mail-Verifizierung)

---

## ⚠️ PROBLEME in der aktuellen Logik

### Problem 1: Verifikations-E-Mail ist nutzlos
- **Aktuell:** Kunde ist bereits `is_verified: true` nach Registrierung
- **Problem:** Verifikations-E-Mail wird gesendet, aber der Link macht nichts
- **Ergebnis:** Kunde kann sich einloggen, auch ohne E-Mail zu verifizieren

### Problem 2: Keine Ablaufzeit für Verifikations-Token
- **Aktuell:** `verification_token` wird gespeichert, aber keine `expires_at` Spalte
- **Problem:** Token läuft nie ab
- **Ergebnis:** Link funktioniert theoretisch für immer

### Problem 3: Doppelte Registrierung mit derselben E-Mail
- **Aktuell:** Prüfung `if (existingCustomer)` → Fehler "Konto existiert bereits"
- **Problem:** Was passiert, wenn:
  - Kunde hat sich registriert, aber E-Mail nicht verifiziert
  - Nach 24+ Stunden will Kunde sich erneut registrieren
  - Konto existiert bereits in DB → Fehler
- **Ergebnis:** Kunde kann sich nicht erneut registrieren, auch wenn nicht verifiziert

### Problem 4: Keine Bereinigung nicht-verifizierter Konten
- **Aktuell:** Nicht-verifizierte Konten bleiben für immer in der DB
- **Problem:** Datenbank wird mit "toten" Konten gefüllt
- **Ergebnis:** Keine automatische Bereinigung

---

## 🎯 Empfohlene Logik (Verbesserung)

### Szenario 1: Normale Registrierung

1. **Registrierung**
   - Kunde füllt Formular aus
   - Daten werden in DB gespeichert:
     - `is_verified: false` ❌ (nicht verifiziert)
     - `verification_token` (generiert)
     - `verification_token_expires_at` (24 Stunden ab jetzt)
     - `portal_activated: false` ❌

2. **E-Mail-Versand**
   - Verifikations-E-Mail mit Link wird gesendet
   - Link: `/verify-email?token=...`
   - Gültigkeit: 24 Stunden

3. **E-Mail-Verifizierung**
   - Kunde klickt auf Link
   - Token wird validiert:
     - Existiert Token?
     - Ist Token abgelaufen? (> 24 Stunden)
     - Wurde Token bereits verwendet?
   - Wenn gültig:
     - `is_verified: true` ✅
     - `portal_activated: true` ✅
     - `verification_token` wird gelöscht/null gesetzt

4. **Login möglich**
   - Nach Verifizierung kann sich Kunde einloggen

### Szenario 2: Verifikations-Link abgelaufen (> 24 Stunden)

**Option A: Neuen Token senden**
1. Kunde klickt auf abgelaufenen Link
2. System erkennt: Token abgelaufen
3. Neuer Token wird generiert
4. Neue Verifikations-E-Mail wird gesendet
5. Neuer Link ist 24 Stunden gültig

**Option B: Konto löschen und erneut registrieren**
1. Kunde klickt auf abgelaufenen Link
2. System erkennt: Token abgelaufen
3. Nicht-verifiziertes Konto wird gelöscht
4. Kunde kann sich erneut registrieren

**Option C: Token erneuern (empfohlen)**
1. Kunde klickt auf abgelaufenen Link
2. System erkennt: Token abgelaufen, aber Konto existiert
3. Neuer Token wird generiert und gespeichert
4. Neue Verifikations-E-Mail wird gesendet
5. Konto bleibt bestehen, nur Token wird erneuert

### Szenario 3: Erneute Registrierung mit derselben E-Mail

**Aktuell:**
- Prüfung: `if (existingCustomer)` → Fehler
- Kunde kann sich nicht erneut registrieren

**Empfohlen:**
1. Prüfe ob Kunde existiert
2. **Wenn Kunde existiert UND verifiziert:**
   - Fehler: "Konto existiert bereits"
3. **Wenn Kunde existiert ABER NICHT verifiziert:**
   - Prüfe: Ist Token abgelaufen? (> 24 Stunden)
   - **Wenn abgelaufen:**
     - Lösche altes Konto ODER
     - Erlaube erneute Registrierung (überschreibe Daten)
   - **Wenn nicht abgelaufen:**
     - Sende neue Verifikations-E-Mail
     - Oder: Fehler "Bitte verifizieren Sie Ihre E-Mail"

---

## 📊 Datenbank-Struktur (aktuell)

### customers Tabelle:
```sql
- id (UUID)
- email (UNIQUE) ✅ Verhindert Duplikate
- password_hash
- name
- phone
- company_name
- customer_number (UNIQUE)
- is_verified (BOOLEAN) - Aktuell: true nach Registrierung
- verification_token (VARCHAR) - Wird generiert, aber nicht verwendet
- reset_token
- reset_token_expires
- portal_activated (BOOLEAN) - Aktuell: true nach Registrierung
- portal_activated_at
- created_at
- updated_at
```

### Fehlende Felder:
- ❌ `verification_token_expires_at` - Ablaufzeit für Token
- ❌ `verification_token_created_at` - Wann wurde Token erstellt

---

## 🔧 Was muss geändert werden?

### 1. Registrierungs-Logik ändern
- `is_verified: false` nach Registrierung (nicht `true`)
- `portal_activated: false` nach Registrierung (nicht `true`)
- `verification_token_expires_at` hinzufügen (24 Stunden)

### 2. Verifikations-Route erstellen
- `/api/auth/verify-email` Route erstellen
- Token validieren
- Ablaufzeit prüfen
- Konto verifizieren

### 3. Doppelte Registrierung behandeln
- Prüfe: Ist Kunde verifiziert?
- Wenn nicht verifiziert: Erlaube erneute Registrierung ODER sende neuen Token

### 4. Datenbank erweitern
- `verification_token_expires_at` Spalte hinzufügen
- Migration erstellen

---

## 📝 Aktuelle Dateien

- **Registrierung:** `/api/auth/register` - Erstellt Konto mit `is_verified: true`
- **Verifikations-Seite:** `/verify-email` - Macht nichts (nur Simulation)
- **E-Mail-Versand:** `/lib/email.ts` - Sendet Verifikations-E-Mail
- **Datenbank:** `/lib/database.ts` - Speichert Kunde in PostgreSQL

