# n8n VPS Setup – Outbound

## Zwei Coolify-Stacks

| Stack | Rolle |
|-------|--------|
| **WebWelle** | Next.js-App, SMTP, OpenRouter |
| **n8n** | Workflows, PageSpeed, Maps, Webhooks |

Outbound läuft **nur in n8n** – relevante Keys aus dem WebWelle-Stack in den **n8n-Stack** kopieren (nicht überschreiben, was schon passt).

## Neue Workflows (additiv)

- **`outbound-v1`** (ID auf VPS: `v4eWPIsT128rV4X9`) – ein Workflow mit allen Webhooks (gemeinsamer Datenspeicher)

Bestehende Funnel/Blog-Workflows **nicht** anfassen.

## Env-Variablen (Coolify **n8n**-App)

**Bereits auf n8n-Stack vorhanden** (aus `info/env.txt`):

- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_PAGESPEED_API_KEY`
- `N8N_WEBHOOK_SECRET` (wird als `OUTBOUND_API_SECRET`-Fallback genutzt)

**Noch in Coolify n8n ergänzen** (Werte vom WebWelle-Stack übernehmen):

```env
OPENROUTER_API_KEY=...              # von WebWelle
WEBWELLE_OPENROUTER_MODEL=openai/gpt-4o-mini
# oder OPENROUTER_MODEL=openai/gpt-4o-mini
EMAIL_SMTP_USER=...                 # von WebWelle (Hostinger)
EMAIL_SMTP_PASSWORD=...
OUTBOUND_ZOOM_URL=https://scheduler.zoom.us/aemanie-gmbh/30-minuten-mit-aemanie-gmbh-herr-manie
OUTBOUND_API_SECRET=...             # optional, gleich wie N8N_WEBHOOK_SECRET
N8N_RUNNERS_CODE_ALLOWED_EXTERNAL_PACKAGES=nodemailer
GOTENBERG_URL=http://gotenberg:3000 # optional, für PDF
```

Nach Env-Änderung: n8n-Container in Coolify **neu starten**.

## Env-Variablen (Coolify **WebWelle**-App)

Für Admin-Tab Marketing (`/admin?tab=marketing`):

```env
N8N_WEBHOOK_BASE_URL=https://DEIN-N8N/webhook
OUTBOUND_API_SECRET=...              # gleich wie N8N_WEBHOOK_SECRET auf n8n
OUTBOUND_ZOOM_URL=https://scheduler.zoom.us/...
# EMAIL_SMTP_* bereits für WebWelle gesetzt
```

Die Next.js-App proxied n8n-Aufrufe serverseitig – **kein Secret im Browser**.
Prospects werden in PostgreSQL (`outbound_prospects`) gespeichert.

## Webhook-URLs

Basis: `https://n8n-o480ss4s8cg40gcs8cw8scsg.145.223.81.159.sslip.io/webhook`

| Pfad | Methode |
|------|---------|
| `outbound-analyze` | POST |
| `outbound-status` | GET |
| `outbound-draft` | GET |
| `outbound-draft-update` | PATCH |
| `outbound-send` | POST |

Header für UI/API: `X-Outbound-Secret: <N8N_WEBHOOK_SECRET>`

## Gotenberg (optional, PDF)

```bash
docker run -d --name gotenberg -p 3000:3000 gotenberg/gotenberg:8
```

In n8n: `GOTENBERG_URL=http://host.docker.internal:3000` (je nach Netzwerk).

## Deploy (MCP oder Sync-Script)

Workflow-JSON bauen, dann per **n8n MCP** (`create_workflow` + `activate_workflow`) oder:

```bash
node outbound/scripts/build-outbound-workflows.mjs
node outbound/scripts/sync-outbound-workflows.mjs --activate
```

Das Sync-Script nutzt dieselben Credentials wie der n8n-MCP-Server (`~/.cursor/mcp.json`).

## Lokale Review-UI

```bash
cp outbound/ui/config.example.js outbound/ui/config.js
# n8nWebhookBase + apiSecret eintragen
npx serve outbound/ui
```

## CORS

Respond-Nodes setzen `Access-Control-Allow-Origin: *` für lokale UI.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| 401 Unauthorized | `OUTBOUND_API_SECRET` / `N8N_WEBHOOK_SECRET` in n8n + `config.js` angleichen |
| Analyse ohne LLM-Text | `OPENROUTER_API_KEY` im **n8n**-Stack setzen |
| Analyse timeout | OpenRouter/PageSpeed Keys prüfen; n8n Executions-Log |
| SMTP Fehler | `EMAIL_SMTP_*` im **n8n**-Stack; `N8N_RUNNERS_CODE_ALLOWED_EXTERNAL_PACKAGES=nodemailer` |
| GBP leer | Legacy Places API in GCP aktivieren: **Places API** (nicht nur „Places API New“) |
