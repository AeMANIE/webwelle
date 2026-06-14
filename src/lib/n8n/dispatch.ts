import { signPayload } from './signature';
import { buildIndustryForResearch } from '@/lib/funnel/industry';
import type { FunnelLead } from '@/lib/funnel/types';

export interface N8nDispatchPayload {
  leadId: string;
  token: string;
  industry: string;
  industryRaw: string;
  industryDetail?: string;
  industryForResearch?: string;
  postalCode: string;
  city?: string;
  market: string;
  country?: string;
  lat?: number;
  lng?: number;
  callbackBaseUrl: string;
  existingWebsite?: boolean;
  existingWebsiteUrl?: string;
  ownSite?: N8nCompetitorPayload;
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
  isOwnSite?: boolean;
}

export interface N8nOwnSiteSupplementPayload extends N8nDispatchPayload {
  ownSite: N8nCompetitorPayload;
  isOwnSiteSupplement: true;
}

function normalizeCompetitorsFromResearch(
  value: unknown
): N8nCompetitorPayload[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<N8nCompetitorPayload[]>((acc, item) => {
    if (!item || typeof item !== 'object') return acc;
    const competitor = item as Record<string, unknown>;
    const domain = String(competitor.domain || '').trim();
    const websiteUrl = String(competitor.websiteUrl || competitor.url || '').trim();
    const name = String(competitor.name || domain || '').trim();
    if (!domain || !websiteUrl) return acc;
    acc.push({
      name,
      domain,
      websiteUrl,
      address: typeof competitor.address === 'string' ? competitor.address : undefined,
      mapsUri: typeof competitor.mapsUri === 'string' ? competitor.mapsUri : undefined,
    });
    return acc;
  }, []);
}

type LeadDispatchSource = Pick<
  FunnelLead,
  | 'id'
  | 'token'
  | 'industry_raw'
  | 'industry_normalized'
  | 'industry_detail'
  | 'postal_code'
  | 'city'
  | 'market'
  | 'country'
  | 'geo_lat'
  | 'geo_lng'
  | 'existing_website'
  | 'existing_website_url'
  | 'company_name'
>;

export function urlToCompetitorPayload(
  url: string,
  name?: string | null
): N8nCompetitorPayload | null {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(normalized);
    return {
      name: name?.trim() || parsed.hostname.replace(/^www\./, ''),
      domain: parsed.hostname,
      websiteUrl: parsed.toString(),
    };
  } catch {
    return null;
  }
}

export function buildDispatchPayloadFromLead(lead: LeadDispatchSource): N8nDispatchPayload {
  const industryForResearch = buildIndustryForResearch(
    lead.industry_normalized,
    lead.industry_detail,
    lead.industry_raw
  );

  return {
    leadId: lead.id,
    token: lead.token,
    industry: industryForResearch,
    industryRaw: lead.industry_raw || '',
    industryDetail: lead.industry_detail || undefined,
    industryForResearch,
    postalCode: lead.postal_code || '',
    city: lead.city || '',
    market: lead.market || 'DE',
    country: lead.country || lead.market || 'DE',
    lat: lead.geo_lat ?? undefined,
    lng: lead.geo_lng ?? undefined,
    callbackBaseUrl: getCallbackBaseUrl(),
    existingWebsite: lead.existing_website === true,
    existingWebsiteUrl: lead.existing_website_url || undefined,
  };
}

export function ownSiteFromLead(lead: LeadDispatchSource): N8nCompetitorPayload | null {
  if (!lead.existing_website || !lead.existing_website_url) return null;
  return urlToCompetitorPayload(
    lead.existing_website_url,
    lead.company_name || 'Eigene Website'
  );
}

async function postWebhook(
  url: string | undefined,
  payload:
    | N8nDispatchPayload
    | N8nSitePerformancePayload
    | N8nSeo01Payload
    | Record<string, unknown>
): Promise<void> {
  if (!url?.trim()) {
    const ref =
      'leadId' in payload && payload.leadId != null
        ? payload.leadId
        : 'jobId' in payload
          ? `job ${payload.jobId}`
          : 'unbekannt';
    console.log(`n8n webhook übersprungen (URL leer): ${ref}`);
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
  options?: { limit?: number; ownSite?: N8nCompetitorPayload | null }
): Promise<void> {
  const limit = options?.limit ?? 5;
  const ownSite = options?.ownSite ?? null;
  const competitorLimit = ownSite ? Math.max(0, limit - 1) : limit;

  const selected = competitors
    .filter((c) => c?.domain?.trim() && c?.websiteUrl?.trim())
    .slice(0, competitorLimit);

  const sites: Array<{ competitor: N8nCompetitorPayload; isOwnSite: boolean }> = [];
  if (ownSite) {
    sites.push({ competitor: ownSite, isOwnSite: true });
  }
  sites.push(...selected.map((competitor) => ({ competitor, isOwnSite: false })));

  if (sites.length === 0) {
    console.warn(`n8n site-performance übersprungen: keine Sites für Lead ${payload.leadId}`);
    return;
  }

  console.log(
    `n8n dispatch: site-performance für Lead ${payload.leadId} (${sites.length} Sites` +
      `${ownSite ? ', inkl. eigene Website' : ''})`
  );

  await Promise.allSettled(
    sites.map(({ competitor, isOwnSite }, siteIndex) =>
      postWebhook(process.env.N8N_WEBHOOK_SITE_PERFORMANCE_URL, {
        ...payload,
        competitor,
        siteIndex,
        totalSites: sites.length,
        isOwnSite,
      })
    )
  );
}

export async function dispatchOwnSitePerformance(
  lead: LeadDispatchSource,
  competitors: N8nCompetitorPayload[] = []
): Promise<void> {
  const ownSite = ownSiteFromLead(lead);
  if (!ownSite) return;

  const payload = buildDispatchPayloadFromLead(lead);
  console.log(
    `n8n dispatch: Performance eigene Website + Wettbewerber für Lead ${payload.leadId}` +
      ` (${ownSite.websiteUrl}, ${competitors.length} Wettbewerber)`
  );

  await dispatchSitePerformance(payload, competitors, { ownSite });
}

function buildOwnSiteResearchPayload(lead: LeadDispatchSource): N8nDispatchPayload | null {
  const ownSite = ownSiteFromLead(lead);
  if (!ownSite) return null;
  return {
    ...buildDispatchPayloadFromLead(lead),
    ownSite,
  };
}

/** Nach Funnel 3: Design + SEO für Kunden-Website und Wettbewerber gemeinsam. */
export async function dispatchOwnSiteDesignAndSeo(lead: LeadDispatchSource): Promise<void> {
  const payload = buildOwnSiteResearchPayload(lead);
  if (!payload) return;

  const targets = [
    { name: 'competitor-design', url: process.env.N8N_WEBHOOK_COMPETITOR_DESIGN_URL },
    { name: 'seo-keywords', url: process.env.N8N_WEBHOOK_SEO_KEYWORDS_URL },
  ];

  console.log(
    `n8n dispatch: Design+SEO eigene Website + Wettbewerber für Lead ${payload.leadId} (${payload.ownSite?.websiteUrl})`
  );

  await Promise.allSettled(targets.map((t) => postWebhook(t.url, payload)));
}

export function competitorsFromResearchPayloads(
  payloads: Array<Record<string, unknown> | null | undefined>
): N8nCompetitorPayload[] {
  const merged = new Map<string, N8nCompetitorPayload>();

  for (const payload of payloads) {
    if (!payload) continue;
    const sources = [
      payload.competitors,
      payload.discoveredCompetitors,
    ];
    for (const source of sources) {
      for (const competitor of normalizeCompetitorsFromResearch(source)) {
        merged.set(competitor.domain.toLowerCase(), competitor);
      }
    }
  }

  return Array.from(merged.values());
}

export function getCallbackBaseUrl(): string {
  return (
    process.env.WEBWELLE_CALLBACK_BASE_URL ||
    process.env.COOLIFY_URL ||
    (process.env.COOLIFY_FQDN ? `https://${process.env.COOLIFY_FQDN}` : undefined) ||
    process.env.WEBWELLE_APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://webwelle.com'
  ).replace(/\/$/, '');
}

export interface N8nBlogOrchestratorPayload extends N8nDispatchPayload {
  jobId: number;
  articleCount: number;
  companyName?: string;
  keywords?: Array<Record<string, unknown>>;
}

export function buildBlogOrchestratorPayload(
  lead: LeadDispatchSource & { company_name?: string | null },
  jobId: number,
  articleCount: number,
  keywords: Array<Record<string, unknown>> = []
): N8nBlogOrchestratorPayload {
  const base = buildDispatchPayloadFromLead(lead);
  return {
    ...base,
    jobId,
    articleCount,
    companyName: lead.company_name || undefined,
    keywords,
  };
}

/** Payload für seo-01-research-project-setup-discovery (branche/plz/land + WebWelle-Kontext). */
export interface N8nSeo01Payload {
  branche: string;
  plz: string;
  land: string;
  jobId: number;
  token: string;
  leadToken: string;
  callbackBaseUrl: string;
  articleCount: number;
  companyName?: string;
  keywords?: Array<Record<string, unknown>>;
  test_mode?: boolean;
}

export function buildSeo01Payload(payload: N8nBlogOrchestratorPayload): N8nSeo01Payload {
  const land = (payload.country || payload.market || 'DE').toUpperCase();
  return {
    branche: payload.industry || payload.industryForResearch || payload.industryRaw || '',
    plz: payload.postalCode || '',
    land: ['DE', 'AT', 'CH'].includes(land) ? land : 'DE',
    jobId: payload.jobId,
    token: payload.token,
    leadToken: payload.token,
    callbackBaseUrl: payload.callbackBaseUrl,
    articleCount: payload.articleCount,
    companyName: payload.companyName,
    keywords: payload.keywords,
  };
}

export async function dispatchBlogPipeline(
  payload: N8nBlogOrchestratorPayload
): Promise<void> {
  const url =
    process.env.N8N_WEBHOOK_SEO_01_URL?.trim() ||
    process.env.N8N_WEBHOOK_BLOG_ORCHESTRATOR_URL?.trim();
  const seoPayload = buildSeo01Payload(payload);
  console.log(`n8n dispatch: seo-01 blog-chain für Job ${payload.jobId} (Lead ${payload.leadId})`);
  await postWebhook(url, seoPayload);
}
