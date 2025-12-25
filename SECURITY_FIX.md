# 🔒 Sicherheits-Fix: Datenbank-Zugangsdaten

## Problem
GitGuardian hat eine PostgreSQL URI in der Git-Historie erkannt. Die Zugangsdaten waren in folgenden Commits enthalten:
- `a292b3d` - feat: Admin Dashboard - Kundenverwaltung mit Detailseite
- `c3d6239` - Phase 2: E-Mail-System implementiert
- `a6d7782` - feat: Redis Integration für Rate Limiting & TAN Store

## Behobene Probleme
✅ Hardcodierte Datenbank-URL aus `scripts/check-database-tables.ts` entfernt
✅ IP-Adresse-Check aus `src/app/api/admin/verify-database/route.ts` entfernt
✅ Alle Zugangsdaten müssen jetzt über Umgebungsvariablen bereitgestellt werden

## ⚠️ WICHTIG: Sofortige Maßnahmen erforderlich

Da die Zugangsdaten bereits in der Git-Historie exponiert wurden, müssen Sie:

### 1. Datenbank-Passwort ändern
```sql
-- In PostgreSQL ausführen:
ALTER USER postgres WITH PASSWORD 'NEUES_SICHERES_PASSWORT';
```

### 2. Firewall-Regeln prüfen
- Stellen Sie sicher, dass nur autorisierte IPs Zugriff haben
- Prüfen Sie die PostgreSQL Firewall-Regeln auf dem Server

### 3. Git-Historie bereinigen (Optional, aber empfohlen)
Die Zugangsdaten sind noch in der Git-Historie. Um sie vollständig zu entfernen:

```bash
# Option 1: BFG Repo-Cleaner (empfohlen)
# Installieren: brew install bfg (oder von https://rtyley.github.io/bfg-repo-cleaner/)
bfg --replace-text passwords.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Option 2: git filter-branch (langsamer)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scripts/check-database-tables.ts" \
  --prune-empty --tag-name-filter cat -- --all
```

### 4. Neue Umgebungsvariablen setzen
In Coolify/Production:
- `DATABASE_URL` auf neue interne URL setzen
- `DATABASE_PUBLICURL` entfernen oder auf neue URL setzen

## Prävention
- ✅ `.env` Dateien sind in `.gitignore`
- ✅ Keine hardcodierten Credentials mehr im Code
- ✅ Alle Zugangsdaten über Umgebungsvariablen

## Nächste Schritte
1. Datenbank-Passwort sofort ändern
2. Firewall-Regeln prüfen
3. Git-Historie bereinigen (optional)
4. Neue Umgebungsvariablen in Production setzen

