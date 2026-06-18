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
      hint: n8nApiKey
        ? 'N8N_API_KEY muss in WebWelle-App und n8n-App identisch sein (seo-06 → /api/blog/publish).'
        : 'N8N_API_KEY fehlt in WebWelle-App — Publish-Callbacks schlagen fehl.',
    },
    n8nWriterEnv: {
      openRouterNote:
        'OPENROUTER_API_KEY muss in der n8n-Coolify-App gesetzt sein (seo-04 LLM).',
    },
    hint: status.ready
      ? 'Blog-Pipeline Env OK — seo-01 kann dispatched werden.'
      : `Fehlende Variablen in Coolify WebWelle-App: ${status.missing.join(', ')}`,
    n8nInternalNote:
      'N8N_INTERNAL_WEBHOOK_BASE muss zusätzlich in der Coolify n8n-App gesetzt sein (seo-02…06 Kette). N8N_API_KEY + OPENROUTER_API_KEY ebenfalls in n8n.',
  });
}
