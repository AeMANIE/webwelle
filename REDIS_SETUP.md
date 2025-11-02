# Redis Setup & Konfiguration

## ✅ Redis Integration abgeschlossen

Redis wurde erfolgreich in das Projekt integriert für:
- ✅ **Rate Limiting** (persistent, atomar)
- ✅ **TAN Store** (überlebt Server-Restarts)
- ✅ **Fallback zu In-Memory** (wenn Redis nicht verfügbar)

---

## 🔧 Umgebungsvariable setzen

### Option 1: .env.local (Empfohlen für lokale Entwicklung)

Erstelle eine `.env.local` Datei im Projekt-Root:

```bash
REDIS_URL=rediss://default:zdlFT1jEsLJpgVwyq7S6H7nA39R6rD5NOe6iCUBNwd4L6ees6S8kaOI0WZQzyu9z@145.223.81.159:6380/0
```

### Option 2: .env (Für Produktion)

Füge die Variable zur `.env` Datei hinzu:

```bash
REDIS_URL=rediss://default:zdlFT1jEsLJpgVwyq7S6H7nA39R6rD5NOe6iCUBNwd4L6ees6S8kaOI0WZQzyu9z@145.223.81.159:6380/0
```

### Option 3: Einzelne Variablen (Alternative)

Alternativ können einzelne Variablen gesetzt werden:

```bash
REDIS_HOST=145.223.81.159
REDIS_PORT=6380
REDIS_PASSWORD=zdlFT1jEsLJpgVwyq7S6H7nA39R6rD5NOe6iCUBNwd4L6ees6S8kaOI0WZQzyu9z
REDIS_DB=0
REDIS_TLS=true
```

---

## 📋 URL Format

Das Redis URL Format ist:
```
rediss://[username]:[password]@[host]:[port]/[database]
```

**Beispiel:**
```
rediss://default:password@145.223.81.159:6380/0
```

- `rediss://` = Redis mit SSL/TLS (mit doppeltem 's')
- `redis://` = Redis ohne SSL (einfaches 's')
- `username` = Optional (oft "default")
- `password` = Ihr Redis Passwort
- `host` = IP-Adresse oder Domain
- `port` = Port (Standard: 6379, TLS: oft 6380)
- `database` = Datenbanknummer (Standard: 0)

---

## ✅ Funktionalität

### Rate Limiting
- ✅ Persistiert über Server-Restarts
- ✅ Funktioniert bei mehreren Server-Instanzen
- ✅ Atomare Operationen (Thread-Safe)
- ✅ Automatisches Expiry (TTL)
- ✅ Fallback zu In-Memory wenn Redis nicht verfügbar

### TAN Store
- ✅ TANs überleben Server-Restarts
- ✅ Automatisches Expiry (10 Minuten TTL)
- ✅ Einmalige Verwendung (wird nach Verifizierung gelöscht)
- ✅ Fallback zu In-Memory wenn Redis nicht verfügbar

---

## 🧪 Testen

### 1. Redis Verbindung testen

Erstelle eine Test-Route (optional):

```typescript
// src/app/api/test-redis/route.ts
import { getRedisClient, isRedisEnabled } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  const client = getRedisClient();
  const enabled = isRedisEnabled();
  
  if (!enabled) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Redis nicht verfügbar - verwende Fallback' 
    });
  }
  
  try {
    await client?.set('test', 'Hello Redis');
    const value = await client?.get('test');
    await client?.del('test');
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Redis funktioniert!',
      testValue: value 
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Redis Fehler',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
```

### 2. In Production testen

Nach dem Deployment:
1. Rate Limiting testen: Mehrfache API-Anfragen → sollte limitiert werden
2. TAN Store testen: TAN anfordern → Server-Restart → TAN sollte noch funktionieren
3. Logs prüfen: `✅ Redis verbunden` sollte erscheinen

---

## 🔍 Troubleshooting

### Problem: "Redis nicht verfügbar"

**Lösung:**
1. Prüfe ob `REDIS_URL` gesetzt ist: `echo $REDIS_URL`
2. Prüfe Redis Server Status
3. Prüfe Firewall/Netzwerk-Verbindung
4. Prüfe Logs für Fehlerdetails

### Problem: "TLS/SSL Fehler"

**Lösung:**
- Stelle sicher, dass `rediss://` (mit doppeltem 's') verwendet wird
- Prüfe ob Port 6380 (TLS) statt 6379 verwendet wird

### Problem: "Passwort falsch"

**Lösung:**
- URL-Encode spezielle Zeichen im Passwort
- Prüfe ob Passwort vollständig kopiert wurde

---

## 📊 Monitoring

### Redis Keys (Namespace)

- `rate_limit:*` - Rate Limiting Daten
- `tan:*` - TAN Store Daten

### Logs

Suche in den Server-Logs nach:
- `✅ Redis verbunden` - Erfolgreiche Verbindung
- `❌ Redis Fehler` - Fehlerdetails
- `⚠️ Redis nicht verfügbar. Verwende In-Memory Store.` - Fallback aktiv

---

## 🚀 Production Checkliste

- [x] `REDIS_URL` in Production Environment gesetzt
- [x] Redis Server läuft und ist erreichbar
- [x] Firewall-Regeln erlauben Verbindung zu Redis
- [x] Passwort sicher gespeichert (nicht in Git)
- [x] TLS/SSL konfiguriert (rediss://)
- [x] Monitoring aktiviert
- [x] Fallback zu In-Memory getestet

---

## 📝 Nächste Schritte (Optional)

Zukünftige Verbesserungen:
- [ ] Query Caching für Admin-Dashboard
- [ ] Session Management mit Redis
- [ ] Email Rate Limiting
- [ ] Redis Cluster Support

---

## 🔐 Sicherheit

**WICHTIG:**
- ❌ **NIEMALS** Redis Passwort in Git committen
- ✅ Verwende `.env.local` für lokale Entwicklung (ist in `.gitignore`)
- ✅ Verwende Environment Variables in Production
- ✅ Verwende TLS (`rediss://`) in Production
- ✅ Firewall-Regeln: Nur erlaubte IPs

