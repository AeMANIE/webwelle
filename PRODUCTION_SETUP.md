# WebWelle - Produktions-Setup

## Umgebungsvariablen für die Produktion

Erstellen Sie eine `.env.local` Datei mit folgenden Variablen:

```bash
# Datenbank-Konfiguration
DATABASE_URL="postgresql://username:password@host:port/database"

# Stripe-Konfiguration (LIVE Keys!)
STRIPE_SECRET_KEY="sk_live_your_live_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_publishable_key_here"

# JWT-Secret für Authentifizierung (WICHTIG: Ändern Sie dies!)
JWT_SECRET="your_very_secure_jwt_secret_key_here_change_in_production"

# E-Mail-Konfiguration (Hostinger SMTP)
EMAIL_USER="info@webwelle.com"
EMAIL_PASS="your_email_app_password_here"
EMAIL_FROM="info@webwelle.com"
EMAIL_HOST="smtp.hostinger.com"
EMAIL_PORT="465"

# Admin-Login-Daten (WICHTIG: Ändern Sie diese!)
ADMIN_EMAIL="admin@webwelle.com"
ADMIN_PASSWORD="your_secure_admin_password_here"

# Base URL (für Produktion)
NEXT_PUBLIC_BASE_URL="https://webwelle.com"
```

## Wichtige Schritte für die Produktion:

### 1. Datenbank einrichten
- PostgreSQL-Datenbank erstellen
- `DATABASE_URL` mit korrekten Zugangsdaten setzen
- Migration ausführen: `GET /api/migrate`

### 2. Stripe konfigurieren
- Live API Keys von Stripe Dashboard holen
- Webhook für Produktion konfigurieren
- Preise für Live-Modus erstellen

### 3. E-Mail konfigurieren
- Hostinger App-Passwort erstellen
- `EMAIL_PASS` mit App-Passwort setzen
- Test-E-Mail senden: `GET /api/test-email`

### 4. Sicherheit
- `JWT_SECRET` mit starkem, zufälligem String ändern
- `ADMIN_PASSWORD` mit starkem Passwort ändern
- Alle Test-Keys durch Live-Keys ersetzen

### 5. Build und Deploy
```bash
npm run build
npm start
```

## Funktionen in der Produktion:

✅ **Kundenregistrierung**: Speichert in PostgreSQL
✅ **E-Mail-Versand**: Echte E-Mails über Hostinger SMTP
✅ **TAN-System**: 2FA per E-Mail
✅ **Admin-Login**: Konfigurierbar über ENV
✅ **Stripe-Integration**: Live-Zahlungen
✅ **Datenbank**: Alle Daten persistent gespeichert

## Test-URLs:

- Hauptseite: `https://webwelle.com`
- Admin-Login: `https://webwelle.com/admin/login`
- Kunden-Login: `https://webwelle.com/customer/login`
- Registrierung: `https://webwelle.com/register`
