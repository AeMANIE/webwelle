# E-Mail-Debugging Guide

## Problem: Keine E-Mails nach Bestellung

### Schritt 1: SMTP-Verbindung testen

**Auf dem Produktions-Server:**
```
GET https://webwelle.com/api/test-smtp-connection
```

**Erwartete Antwort bei Erfolg:**
```json
{
  "status": "success",
  "message": "SMTP-Verbindung erfolgreich"
}
```

**Bei Fehler:**
```json
{
  "status": "error",
  "message": "SMTP-Verbindung fehlgeschlagen",
  "error": {
    "message": "...",
    "hint": "Authentifizierung fehlgeschlagen..."
  }
}
```

### Schritt 2: Test-E-Mail senden

**POST Request:**
```
POST https://webwelle.com/api/test-email
Content-Type: application/json

{
  "email": "harmonie_556@yahoo.com"
}
```

### Schritt 3: Webhook-Logs prüfen

Nach einer Testbestellung sollten diese Logs erscheinen:

1. `🔔 Stripe Webhook empfangen`
2. `✅ Webhook Event verifiziert: checkout.session.completed`
3. `📧 sendBookingAndActivationEmails aufgerufen für Session: cs_...`
4. `📧 E-Mail-Konfiguration prüfen: EMAIL_SMTP_USER=✅ gesetzt, EMAIL_SMTP_PASSWORD=✅ gesetzt`
5. `📧 Versende Bestellbestätigung an: harmonie_556@yahoo.com`
6. `✅ Bestellbestätigung erfolgreich gesendet an harmonie_556@yahoo.com`

**Wenn Fehler:**
- `❌ Fehler beim Senden der E-Mail: ...`
- `❌ Fehler-Details: { code: "EAUTH", hint: "Authentifizierung fehlgeschlagen..." }`

### Schritt 4: Häufige Probleme und Lösungen

#### Problem 1: Passwort mit Sonderzeichen (z.B. `+`)

**Lösung:** Passwort in Anführungszeichen setzen:
```bash
EMAIL_SMTP_PASSWORD="87437Kempten+"
```

#### Problem 2: Webhook wird nicht aufgerufen

**Prüfung:**
1. Stripe Dashboard → Webhooks
2. Endpunkt prüfen: `https://webwelle.com/api/stripe/webhook`
3. Events prüfen: `checkout.session.completed` sollte grün sein
4. Letzte Events ansehen: Gibt es Fehler?

**Lösung:**
- Webhook-Secret prüfen: `STRIPE_WEBHOOK_SECRET=whsec_...`
- Webhook-Endpunkt testen mit Stripe CLI:
  ```bash
  stripe listen --forward-to https://webwelle.com/api/stripe/webhook
  ```

#### Problem 3: Environment-Variablen nicht geladen

**Lösung:**
- Server nach dem Setzen der ENV-Variablen neu starten
- Prüfen ob `.env` oder `.env.local` im Projekt-Root ist
- Auf VPS: Prüfen ob ENV-Variablen in Systemd/PM2 konfiguriert sind

#### Problem 4: SMTP-Authentifizierung fehlgeschlagen

**Prüfung:**
- Benutzername: Vollständige E-Mail-Adresse (z.B. `info@webwelle.com`)
- Passwort: E-Mail-Konto-Passwort aus Hostinger
- Prüfen ob 2FA aktiviert ist (dann App-Passwort nötig)

**Lösung:**
1. In Hostinger hPanel: E-Mail-Konto prüfen
2. Passwort zurücksetzen falls nötig
3. Neu setzen in ENV-Variablen

### Schritt 5: Manuelle E-Mail senden (wenn Webhook fehlgeschlagen)

Wenn eine Bestellung bereits in der Datenbank ist, kann die E-Mail manuell gesendet werden:

```
POST https://webwelle.com/api/manual-send-booking-email
Content-Type: application/json

{
  "sessionId": "cs_test_..."
}
```

## Debug-Routen

- `/api/test-smtp-connection` - SMTP-Verbindung testen
- `/api/test-email` - Test-E-Mail senden
- `/api/debug-webhook-email` - Konfiguration prüfen
- `/api/manual-send-booking-email` - Bestellbestätigung manuell senden

