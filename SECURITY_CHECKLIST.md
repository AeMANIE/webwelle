# 🔒 Sicherheits-Checkliste

## ✅ Sensible Daten - Status

### ✅ Keine sensiblen Daten im Code
- ✅ Keine hardcodierten Passwörter
- ✅ Keine API-Keys im Code
- ✅ Keine Datenbank-URLs im Code
- ✅ Alle sensiblen Daten kommen aus Umgebungsvariablen

### ✅ .gitignore konfiguriert
- ✅ `.env*.local` ist in `.gitignore`
- ✅ `.env` ist in `.gitignore`
- ✅ Keine `.env` Dateien werden auf GitHub hochgeladen

### ✅ Umgebungsvariablen
Alle sensiblen Daten müssen über Umgebungsvariablen gesetzt werden:

**Erforderliche Umgebungsvariablen:**
- `DATABASE_URL` - PostgreSQL Verbindungsstring
- `JWT_SECRET` - Secret für JWT-Token
- `ADMIN_EMAIL` - Admin-E-Mail-Adresse
- `ADMIN_PASSWORD_HASH` oder `ADMIN_PASSWORD` - Admin-Passwort (Hash bevorzugt)
- `STRIPE_SECRET_KEY` - Stripe Secret Key
- `STRIPE_WEBHOOK_SECRET` - Stripe Webhook Secret
- `EMAIL_SMTP_USER` - SMTP Benutzername
- `EMAIL_SMTP_PASSWORD` - SMTP Passwort
- `REDIS_URL` - Redis Verbindungsstring (optional)

### ⚠️ Wichtige Hinweise

1. **Niemals `.env.local` committen**
   - Die Datei ist bereits in `.gitignore`
   - Prüfen Sie vor jedem Commit: `git status`

2. **Keine sensiblen Daten in Logs**
   - Passwörter werden nie geloggt
   - API-Keys werden nie geloggt
   - Nur Status-Indikatoren (✅/❌) werden geloggt

3. **Debug-Routen geschützt**
   - Debug-Routen sind nur in Development verfügbar
   - Oder mit `ALLOW_DEBUG_ROUTES=true` (nur für Admins)

4. **Test-Passwörter**
   - Hardcodierte Test-Passwörter sind nur für Development
   - Werden nur verwendet, wenn `NODE_ENV !== 'production'`
   - In Production werden Kunden aus der Datenbank geladen

### 🔍 Prüfung vor Deployment

Vor jedem Deployment prüfen:
```bash
# Prüfe ob .env Dateien im Git sind
git ls-files | grep -E "\.env|\.local"

# Sollte leer sein! Falls nicht, entfernen:
git rm --cached .env.local
```

### 📝 Deployment-Checkliste

- [ ] Keine `.env` Dateien im Git
- [ ] Alle Umgebungsvariablen in Coolify/Deployment-Plattform gesetzt
- [ ] `NODE_ENV=production` gesetzt
- [ ] `ALLOW_DEBUG_ROUTES` nicht gesetzt (oder nur für Admins)
- [ ] Alle Passwörter sind gehasht (ADMIN_PASSWORD_HASH statt ADMIN_PASSWORD)

