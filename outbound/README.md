# WebWelle Outbound Prospecting

Cold-Outbound: Website-URL → Analyse (n8n VPS) → Review & Versand im **Admin-Dashboard** auf webwelle.com.

## Produktiv (empfohlen)

1. Admin öffnen: **https://webwelle.com/admin?tab=marketing**
2. Website-URL eingeben → Analyse starten
3. Prospect prüfen, Upsells wählen, PDF & E-Mail versenden
4. Versandhistorie in der Marketing-Tabelle (`sent_at`, Empfänger)

Alle Prospects werden in PostgreSQL (`outbound_prospects`) gespeichert und optional mit Kunden/Funnel-Leads verknüpft.

### Env (Coolify WebWelle-Stack)

| Variable | Zweck |
|----------|--------|
| `N8N_WEBHOOK_BASE_URL` | z. B. `https://…/webhook` |
| `OUTBOUND_API_SECRET` | Gleich wie `N8N_WEBHOOK_SECRET` auf n8n |
| `EMAIL_SMTP_USER` / `EMAIL_SMTP_PASSWORD` | Versand (bereits für WebWelle) |
| `OUTBOUND_ZOOM_URL` | Optional – Zoom-CTA in E-Mails |

### API (intern, Admin-Auth)

| Route | Aufgabe |
|-------|---------|
| `POST /api/admin/outbound/analyze` | Analyse starten |
| `GET /api/admin/outbound/prospects` | Liste |
| `GET/PATCH /api/admin/outbound/prospects/[id]` | Detail / Speichern |
| `POST …/send` | E-Mail + PDF |
| `POST …/pdf` | PDF-Vorschau |

## n8n deployen (VPS)

```bash
node outbound/scripts/build-outbound-workflows.mjs
node outbound/scripts/sync-outbound-workflows.mjs --activate
```

Siehe [`docs/n8n-vps-setup.md`](docs/n8n-vps-setup.md).

## Deprecated: lokales `outbound:ui`

`npm run outbound:ui` (Mac-only) ist **veraltet**. Nutze das Admin-Dashboard.

```bash
# Nur noch für Pipeline-Entwicklung / Tests:
npm run outbound:ui
```

## Webhooks (n8n)

| Pfad | Methode | Aufgabe |
|------|---------|---------|
| `outbound-analyze` | POST | Analyse |
| `outbound-draft` | GET | Draft laden |
| `outbound-draft-update` | POST | Draft patchen |

Header: `X-Outbound-Secret` (nur serverseitig in Next.js – nicht im Browser)
