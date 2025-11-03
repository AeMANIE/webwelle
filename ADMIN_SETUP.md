# Admin-Login Setup

## Problem behoben! ✅

Der alte Hash passte nicht zum Passwort. Verwende diesen korrekten Hash:

## Umgebungsvariablen auf dem VPS (.env oder .env.local):

```bash
ADMIN_EMAIL=admin@webwelle.com
ADMIN_PASSWORD_HASH=$2b$10$j3mEo.7hOvweyT4jmPIZau/jUojAZppq51y4ojTh2kteaUdHpUuTy
```

## Login-Daten:

- **URL**: `https://webwelle.com/admin/login`
- **E-Mail**: `admin@webwelle.com`
- **Passwort**: `87437Kempten+`

## Wichtig:

1. **KEINE Anführungszeichen** in der .env-Datei!
2. Nach Änderung: **VPS komplett neu starten** (PM2 restart oder Service neu starten)
3. Der Hash muss **genau** wie oben sein (keine Leerzeichen am Anfang/Ende)

## Debug-Route (optional):

Falls es immer noch nicht funktioniert, rufe auf:
```
https://webwelle.com/api/debug-admin-auth
```

Diese Route zeigt:
- Ob ADMIN_EMAIL und ADMIN_PASSWORD_HASH gesetzt sind
- Ob der Hash mit dem Passwort übereinstimmt
- Empfehlungen zur Fehlerbehebung

