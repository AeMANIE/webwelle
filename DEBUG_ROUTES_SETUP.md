# Debug-Routes Aktivierung

## Problem
Die Debug-Routen sind in Production blockiert.

## Lösung
Füge diese Environment-Variable auf dem VPS hinzu:

```bash
ALLOW_DEBUG_ROUTES=true
```

## VPS Setup (einmalig)

1. Auf VPS einloggen
2. `.env` Datei bearbeiten (oder Environment-Variablen setzen):
   ```bash
   # In .env oder als Environment-Variable:
   ALLOW_DEBUG_ROUTES=true
   ```
3. Server neu starten (damit neue ENV-Variablen geladen werden)

## Nach dem Setup - Tests ausführen

### Option 1: Test-E-Mail senden
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

### Option 2: Konfiguration prüfen
```bash
curl https://webwelle.com/api/debug-email-webhook
```

### Option 3: SMTP-Verbindung testen
```bash
curl https://webwelle.com/api/test-smtp-connection
```

## Sicherheitshinweis
⚠️ **Wichtig**: `ALLOW_DEBUG_ROUTES=true` sollte nur temporär aktiviert werden, um das E-Mail-System zu debuggen. Nach erfolgreichem Test wieder entfernen!

## Alternative: Ohne Flag
Wenn du die Debug-Routen dauerhaft verfügbar haben möchtest, kann ich die Sicherheitsprüfung entfernen. Das ist aber nicht empfohlen für Production.

