import { NextRequest } from 'next/server';
import { requireStaffAuth, secureResponse } from '@/lib/api-security';
import { getBlogPipelineEnvStatus, getCallbackBaseUrl } from '@/lib/n8n/dispatch';

export async function GET(request: NextRequest) {
  const auth = await requireStaffAuth(request, 'TEAM');
  if (auth instanceof Response) return auth;

  const status = getBlogPipelineEnvStatus();
  const callbackBaseUrl = getCallbackBaseUrl();
  const n8nApiKey = process.env.N8N_API_KEY?.trim();

  return secureResponse({
    ...status,
    callbackBaseUrl,
    publishAuth: {
      n8nApiKeySet: Boolean(n8nApiKey),
      hmacNote: 'Publish akzeptiert x-api-key oder x-webwelle-signature (N8N_WEBHOOK_SECRET).',
      hint: n8nApiKey
        ? 'N8N_API_KEY in WebWelle + optional in n8n. Alternativ reicht N8N_WEBHOOK_SECRET in n8n für Publish-HMAC.'
        : 'N8N_API_KEY fehlt in WebWelle-App — Publish per API-Key schlägt fehl (HMAC weiter möglich).',
    },
    n8nWriterEnv: {
      openRouterNote:
        'OPENROUTER_API_KEY + OPENROUTER_MODEL in n8n-Coolify (seo-04). Empfohlen: openai/gpt-4o-mini — bei 402 OPENROUTER_MAX_TOKENS=1200.',
      dataForSeoNote:
        'DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD in n8n-Coolify (seo-01 + seo-03). Demo-Konto: API Access unter dataforseo.com.',
    },
    hint: status.ready
      ? 'Blog-Pipeline Env OK — seo-01 kann dispatched werden.'
      : `Fehlende Variablen in Coolify WebWelle-App: ${status.missing.join(', ')}`,
    n8nInternalNote:
      'N8N_INTERNAL_WEBHOOK_BASE muss zusätzlich in der Coolify n8n-App gesetzt sein (seo-02…06 Kette). N8N_API_KEY + OPENROUTER_API_KEY ebenfalls in n8n.',
  });
}
