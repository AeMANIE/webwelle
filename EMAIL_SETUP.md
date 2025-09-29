# E-Mail-Konfiguration für WebWelle

## SMTP-Server Details
- **Host**: smtp.hostinger.com
- **Port**: 465
- **Verschlüsselung**: SSL/TLS
- **Absender-E-Mail**: info@webwelle.com

## Umgebungsvariablen (.env.local)

Fügen Sie folgende Variablen zu Ihrer `.env.local` Datei hinzu:

```env
# E-Mail-Konfiguration für 2FA
EMAIL_USER="info@webwelle.com"
EMAIL_PASS="ihr-email-passwort"
EMAIL_FROM="info@webwelle.com"
```

## Passwort für E-Mail-Konto

**Wichtig**: Verwenden Sie das **App-Passwort** für Ihr Hostinger E-Mail-Konto, nicht das normale Passwort!

### App-Passwort erstellen:
1. Loggen Sie sich in Ihr Hostinger Control Panel ein
2. Gehen Sie zu "E-Mail Accounts"
3. Wählen Sie info@webwelle.com
4. Klicken Sie auf "Manage"
5. Gehen Sie zu "Security" oder "App Passwords"
6. Erstellen Sie ein neues App-Passwort
7. Kopieren Sie das generierte Passwort

## Test der E-Mail-Konfiguration

Nach der Konfiguration können Sie die E-Mail-Funktionalität testen:

```bash
# Test-E-Mail senden
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"ihre-test-email@example.com"}'
```

## 2FA-Login testen

1. Gehen Sie zu: http://localhost:3001/customer/login
2. E-Mail: customer1@example.com
3. Passwort: Password123!
4. Klicken Sie "TAN anfordern"
5. Prüfen Sie Ihr E-Mail-Postfach für den TAN-Code
6. Geben Sie den TAN ein und klicken Sie "Verifizieren"

## Fehlerbehebung

### Häufige Probleme:

1. **"Invalid login"**: 
   - Überprüfen Sie das App-Passwort
   - Stellen Sie sicher, dass 2FA für das E-Mail-Konto aktiviert ist

2. **"Connection timeout"**:
   - Überprüfen Sie die SMTP-Einstellungen
   - Port 465 mit SSL verwenden

3. **"Authentication failed"**:
   - Verwenden Sie das App-Passwort, nicht das normale Passwort
   - Überprüfen Sie die E-Mail-Adresse

### Debug-Logs

Die E-Mail-Versendung wird in der Console geloggt:
- ✅ Erfolgreiche Versendung
- ❌ Fehler beim Versenden

## Produktions-Einstellungen

Für die Produktion sollten Sie zusätzlich konfigurieren:

1. **SPF-Record** in Ihren DNS-Einstellungen
2. **DKIM-Signatur** für bessere Zustellbarkeit
3. **DMARC-Policy** für E-Mail-Sicherheit

## Sicherheitshinweise

- Speichern Sie niemals E-Mail-Passwörter im Code
- Verwenden Sie immer Umgebungsvariablen
- Regenerieren Sie App-Passwörter regelmäßig
- Überwachen Sie E-Mail-Versendungen auf Missbrauch
