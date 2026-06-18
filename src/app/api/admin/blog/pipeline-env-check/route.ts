import { NextRequest } from 'next/server';
import { requireStaffAuth, secureResponse } from '@/lib/api-security';
import { getBlogPipelineEnvStatus } from '@/lib/n8n/dispatch';

export async function GET(request: NextRequest) {
  const auth = await requireStaffAuth(request, 'TEAM');
  if (auth instanceof Response) return auth;

  const status = getBlogPipelineEnvStatus();
  return secureResponse({
    ...status,
    hint: status.ready
      ? 'Blog-Pipeline Env OK — seo-01 kann dispatched werden.'
      : `Fehlende Variablen in Coolify WebWelle-App: ${status.missing.join(', ')}`,
    n8nInternalNote:
      'N8N_INTERNAL_WEBHOOK_BASE muss zusätzlich in der Coolify n8n-App gesetzt sein (seo-02…06 Kette).',
  });
}
