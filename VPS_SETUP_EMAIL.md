# VPS Setup für E-Mail-Debugging

## Schritt 1: Environment-Variable setzen

Auf dem VPS diese Variable hinzufügen:

```bash
# In .env Datei hinzufügen:
ALLOW_DEBUG_ROUTES=true
```

**WICHTIG**: Nach dem Hinzufügen der Variable **Server neu starten**!

## Schritt 2: Server neu starten

Je nach Deployment:
- PM2: `pm2 restart webwelle`
- systemd: `systemctl restart webwelle`
- Docker: Container neu starten
- Vercel: Automatisch nach Push

## Schritt 3: Tests ausführen

Nach dem Neustart kannst du die Tests ausführen:

### Test 1: Konfiguration prüfen
```bash
curl https://webwelle.com/api/debug-email-webhook
```

### Test 2: SMTP-Verbindung testen
```bash
curl https://webwelle.com/api/test-smtp-connection
```

### Test 3: Test-E-Mail senden
```bash
curl -X POST https://webwelle.com/api/test-booking-email \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "harmonie_556@yahoo.com",
    "customerName": "Test Kunde",
    "packageType": "starterwelle",
    "packageCategory": "webdesign"
  }'
```

## Erwartete Ergebnisse

### Test 1 sollte zeigen:
```json
{
  "status": "success",
  "email": {
    "EMAIL_SMTP_USER": "✅ gesetzt",
    "EMAIL_SMTP_PASSWORD": "✅ gesetzt",
    ...
  },
  "redis": "✅ Verbunden",
  "webhook": {
    "STRIPE_WEBHOOK_SECRET": "✅ gesetzt",
    ...
  }
}
```

### Test 2 sollte zeigen:
```json
{
  "status": "success",
  "message": "SMTP-Verbindung erfolgreich",
  ...
}
```

### Test 3 sollte zeigen:
```json
{
  "status": "success",
  "message": "E-Mails erfolgreich gesendet",
  "results": {
    "bookingConfirmation": { "success": true },
    "portalActivation": { "success": true }
  }
}
```

## Wenn Tests fehlschlagen

1. **Prüfe Server-Logs** für detaillierte Fehlermeldungen
2. **Prüfe ob ENV-Variablen geladen sind**:
   ```bash
   # Auf VPS:
   printenv | grep EMAIL
   printenv | grep ALLOW_DEBUG
   ```
3. **Prüfe SMTP-Passwort**: Wenn Passwort `+` enthält, eventuell URL-Encoding nötig
4. **Prüfe Firewall**: Port 465 muss für ausgehende Verbindungen offen sein

