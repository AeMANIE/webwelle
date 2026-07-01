function getN8nBase(): string {
  const base = process.env.N8N_WEBHOOK_BASE_URL || '';
  if (!base) throw new Error('N8N_WEBHOOK_BASE_URL fehlt in Umgebungsvariablen');
  return base.replace(/\/$/, '');
}

function getSecret(): string {
  return process.env.OUTBOUND_API_SECRET || process.env.N8N_WEBHOOK_SECRET || '';
}

export async function fetchN8n<T = unknown>(
  path: string,
  opts?: { method?: string; body?: unknown; query?: Record<string, string> },
): Promise<T> {
  const base = getN8nBase();
  const url = new URL(`${base}/${path.replace(/^\//, '')}`);
  if (opts?.query) {
    for (const [k, v] of Object.entries(opts.query)) url.searchParams.set(k, v);
  }
  const secret = getSecret();
  const res = await fetch(url.toString(), {
    method: opts?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'X-Outbound-Secret': secret } : {}),
    },
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { error?: string; hint?: string }).error
      || (data as { message?: string }).message
      || `n8n HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function n8nAnalyze(body: {
  websiteUrl: string;
  googleMapsUrl?: string;
  industryHint?: string;
}): Promise<{ prospectId: string; status: string; domain?: string }> {
  return fetchN8n('outbound-analyze', { method: 'POST', body });
}

export async function n8nGetDraft(externalId: string): Promise<Record<string, unknown>> {
  return fetchN8n('outbound-draft', { query: { id: externalId } });
}

export async function n8nPatchDraft(externalId: string, patch: Record<string, unknown>): Promise<void> {
  await fetchN8n('outbound-draft-update', {
    method: 'POST',
    query: { id: externalId },
    body: { patch },
  });
}
