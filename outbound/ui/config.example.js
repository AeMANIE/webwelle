/**
 * WebWelle Outbound UI – lokale Konfiguration
 * Kopieren nach config.js und Werte eintragen.
 */
window.OUTBOUND_CONFIG = {
  /** Basis-URL n8n Webhooks */
  n8nWebhookBase: 'https://n8n-o480ss4s8cg40gcs8cw8scsg.145.223.81.159.sslip.io/webhook',
  /** Gleicher Wert wie N8N_WEBHOOK_SECRET / OUTBOUND_API_SECRET auf n8n-Stack */
  /** Auf localhost: Versand über /api/outbound-send (npm run outbound:ui). Auf false setzen für n8n-Versand. */
  useLocalSend: true,
