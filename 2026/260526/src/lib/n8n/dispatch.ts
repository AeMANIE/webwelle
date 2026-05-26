import { signPayload } from './signature';

export interface N8nDispatchPayload {
  leadId: string;
  token: string;
  industry: string;
  industryRaw: string;
  postalCode: string;
  city?: string;
  market: string;
  country?: string;
  lat?: number;
  lng?: number;
  callbackBaseUrl: string;
}

export interface N8nCompetitorPayload {
  name: string;
  domain: string;
  websiteUrl: string;
  address?: string;
  mapsUri?: string;
}

export interface N8nSitePerformancePayload extends N8nDispatchPayload {
  competitor: N8nCompetitorPayload;
  siteIndex: number;
  totalSites: number;
}

async function postWebhook(
  url: string | undefined,
  payload: N8nDispatchPayload | N8nSitePerformancePayload
): Promise<void> {
  if (!url?.trim()) {
    console.log(`n8n webhook übersprungen (URL leer): ${payload.leadId}`);
    return;
  }

  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('N8N_WEBHOOK_SECRET nicht gesetzt');
    return;
  }

  const body = JSON.stringify(payload);
  const timeout = parseInt(process.env.N8N_DISPATCH_TIMEOUT_MS || '130000', 10);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webwelle-signature': signPayload(body, secret),
      },
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`n8n webhook fehlgeschlagen ${url}:`, res.status, text);
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function dispatchAllResearch(payload: N8nDispatchPayload): Promise<void> {
  const targets: Array<{ name: string; url: string | undefined }> = [
    {
      name: 'industry-questions',
      url: process.env.N8N_WEBHOOK_INDUSTRY_QUESTIONS_URL,
    },
    { name: 'seo-keywords', url: process.env.N8N_WEBHOOK_SEO_KEYWORDS_URL },
    {
      name: 'competitor-design',
      url: process.env.N8N_WEBHOOK_COMPETITOR_DESIGN_URL,
    },
    { name: 'research', url: process.env.N8N_RESEARCH_WEBHOOK_URL },
    {
      name: 'site-performance',
      url: process.env.N8N_WEBHOOK_SITE_PERFORMANCE_URL,
    },
  ];

  const ready = targets.filter((t) => !!t.url?.trim());
  const missing = targets.filter((t) => !t.url?.trim());

  if (missing.length > 0) {
    console.warn(
      `n8n dispatch: fehlende Webhook-URLs (${missing
        .map((m) => m.name)
        .join(', ')}).`
    );
  }

  console.log(
    `n8n dispatch: trigger für Lead ${payload.leadId} (${ready
      .map((t) => t.name)
      .join(', ')})`
  );

  await Promise.allSettled(ready.map((t) => postWebhook(t.url, payload)));
}

export async function dispatchSitePerformance(
  payload: N8nDispatchPayload,
  competitors: N8nCompetitorPayload[],
  limit = 4
): Promise<void> {
  const selected = competitors
    .filter((c) => c?.domain?.trim() && c?.websiteUrl?.trim())
    .slice(0, limit);

  if (selected.length === 0) {
    console.warn(`n8n site-performance übersprungen: keine Wettbewerber für Lead ${payload.leadId}`);
    return;
  }

  console.log(
    `n8n dispatch: site-performance für Lead ${payload.leadId} (${selected.length} Sites)`
  );

  await Promise.allSettled(
    selected.map((competitor, siteIndex) =>
      postWebhook(process.env.N8N_WEBHOOK_SITE_PERFORMANCE_URL, {
        ...payload,
        competitor,
        siteIndex,
        totalSites: selected.length,
      })
    )
  );
}

export function getCallbackBaseUrl(): string {
  return (
    process.env.WEBWELLE_CALLBACK_BASE_URL ||
    process.env.WEBWELLE_APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}
