# E-Mail-System Debugging - Anleitung

## Problem
E-Mails werden nach Bestellung nicht empfangen.

## Debugging-Schritte

### 1. Konfiguration prüfen
```bash
# Auf Produktions-Server aufrufen:
curl https://webwelle.com/api/debug-email-webhook

# Sollte zeigen:
# - EMAIL_SMTP_USER: ✅ gesetzt
# - EMAIL_SMTP_PASSWORD: ✅ gesetzt
# - Redis: ✅ Verbunden
# - STRIPE_WEBHOOK_SECRET: ✅ gesetzt
```

### 2. SMTP-Verbindung testen
```bash
# Auf Produktions-Server:
curl https://webwelle.com/api/test-smtp-connection

# Sollte "SMTP-Verbindung erfolgreich" zurückgeben
```

### 3. Test-E-Mail senden
```bash
# Test-Bestellungs-E-Mail senden:
curl -X POST https://webwelle.com/api/test-booking-email \
  -H "Content-Type: application/json" \
  -d '{"customerEmail": "harmonie_556@yahoo.com", "customerName": "Test"}'

# Sollte beide E-Mails senden:
# - Bestellbestätigung
# - Portal-Aktivierung (wenn packageCategory = webdesign)
```

### 4. Webhook-Logs prüfen
Nach einer echten Bestellung sollten diese Logs im Server erscheinen:
```
🔔 Stripe Webhook empfangen
✅ Webhook Event verifiziert: checkout.session.completed
📦 Processing checkout.session.completed für Session: cs_...
✅ Buchung erfolgreich in Datenbank gespeichert
📧 Versuche E-Mails zu senden an: harmonie_556@yahoo.com
📧 sendBookingAndActivationEmails aufgerufen für Session: ...
📧 E-Mail-Konfiguration prüfen: EMAIL_SMTP_USER=✅ gesetzt, EMAIL_SMTP_PASSWORD=✅ gesetzt
📧 Versende Bestellbestätigung an: harmonie_556@yahoo.com
✅ Bestellbestätigung erfolgreich gesendet an harmonie_556@yahoo.com
```

### 5. Häufige Probleme

#### Problem: "EMAIL_SMTP_USER oder EMAIL_SMTP_PASSWORD fehlt"
**Lösung**: Auf VPS prüfen ob `.env` oder Environment-Variablen gesetzt sind:
```bash
# Auf VPS:
echo $EMAIL_SMTP_USER
echo $EMAIL_SMTP_PASSWORD
```

#### Problem: "SMTP-Verbindung fehlgeschlagen" (EAUTH)
**Lösung**: 
- Passwort prüfen (kann Sonderzeichen wie `+` enthalten - eventuell URL-Encoding nötig)
- Bei Hostinger: Prüfen ob E-Mail-Account aktiviert ist
- Prüfen ob Port 465 nicht blockiert ist (Firewall)

#### Problem: "Keine customer_email in Session gefunden"
**Lösung**: 
- Stripe Checkout Session muss `customer_email` enthalten
- Prüfen ob Kunde E-Mail bei Stripe eingegeben hat
- In Stripe Dashboard → Checkout Sessions → Session prüfen

#### Problem: "E-Mail wurde bereits gesendet"
**Lösung**: 
- Redis verhindert Duplikate (24h TTL)
- Prüfen ob Webhook mehrfach aufgerufen wurde
- Redis Key löschen: `redis-cli DEL email_sent:cs_...`

#### Problem: E-Mails gehen in Spam
**Lösung**:
- SPF/DKIM/DMARC Records prüfen
- Absender-Domain (webwelle.com) muss für info@webwelle.com konfiguriert sein
- In Hostinger: E-Mail-Account-Einstellungen prüfen

### 6. Manuelle E-Mail senden
Wenn Webhook nicht funktioniert, kann E-Mail manuell gesendet werden:
```bash
curl -X POST https://webwelle.com/api/manual-send-booking-email \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "cs_..."}'
```

### 7. Test-Purchase auf webwelle.com
1. Gehe zu https://webwelle.com
2. Wähle ein Paket (z.B. StarterWelle)
3. Fülle das Formular aus
4. Email: harmonie_556@yahoo.com
5. Bezahle mit Stripe Test-Karte (4242 4242 4242 4242)
6. Prüfe Server-Logs nach Webhook-Aufruf
7. Prüfe E-Mail-Postfach (auch Spam-Ordner)

## Nächste Schritte
Wenn alle Tests erfolgreich sind, aber E-Mails nicht ankommen:
1. Hostinger E-Mail-Logs prüfen
2. Yahoo Mail Spam-Ordner prüfen
3. Alternative E-Mail-Adresse testen
4. DNS Records für E-Mail-Delivery prüfen

