import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './database';
import { OUTBOUND_MIGRATION_SQL } from './outbound-migration-sql';

export type OutboundProspectStatus = 'analyzing' | 'draft' | 'sent' | 'replied' | 'lost' | 'bounced';

export interface OutboundProspectRow {
  id: string;
  external_id: string;
  domain: string;
  website_url: string;
  status: OutboundProspectStatus;
  company_name: string | null;
  preferred_email: string | null;
  city: string | null;
  postal_code: string | null;
  audit_payload: Record<string, unknown>;
  email_draft: Record<string, unknown> | null;
  sent_at: string | null;
  sent_to: string | null;
  sent_by_staff_id: string | null;
  customer_id: string | null;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface N8nProspectDraft {
  id: string;
  websiteUrl?: string;
  domain?: string;
  status?: string;
  company?: {
    name?: string;
    managingDirector?: string;
    city?: string;
    postalCode?: string;
    address?: string;
    industryGuess?: string;
  };
  contacts?: {
    preferredEmail?: string;
    emails?: string[];
    phones?: string[];
  };
  technology?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  performance?: Record<string, unknown>;
  conversion?: Record<string, unknown>;
  legal?: Record<string, unknown>;
  googleBusiness?: Record<string, unknown>;
  offer?: Record<string, unknown>;
  email?: Record<string, unknown>;
  editedByUser?: boolean;
  sentAt?: string | null;
}

function mapRow(row: Record<string, unknown>): OutboundProspectRow {
  return {
    id: String(row.id),
    external_id: String(row.external_id),
    domain: String(row.domain),
    website_url: String(row.website_url),
    status: row.status as OutboundProspectStatus,
    company_name: row.company_name ? String(row.company_name) : null,
    preferred_email: row.preferred_email ? String(row.preferred_email) : null,
    city: row.city ? String(row.city) : null,
    postal_code: row.postal_code ? String(row.postal_code) : null,
    audit_payload: (row.audit_payload as Record<string, unknown>) || {},
    email_draft: (row.email_draft as Record<string, unknown>) || null,
    sent_at: row.sent_at ? String(row.sent_at) : null,
    sent_to: row.sent_to ? String(row.sent_to) : null,
    sent_by_staff_id: row.sent_by_staff_id ? String(row.sent_by_staff_id) : null,
    customer_id: row.customer_id ? String(row.customer_id) : null,
    lead_id: row.lead_id ? String(row.lead_id) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function ensureOutboundTables(): Promise<void> {
  const client = await pool.connect();
  try {
    const sqlPath = join(process.cwd(), 'src/lib/sql/outbound_tables.sql');
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, 'utf8') : OUTBOUND_MIGRATION_SQL;
    await client.query(sql);
    await client.query(`
      ALTER TABLE outbound_prospects ADD COLUMN IF NOT EXISTS sent_by_staff_id UUID;
      ALTER TABLE outbound_prospects ADD COLUMN IF NOT EXISTS lead_id UUID;
    `);
  } finally {
    client.release();
  }
}

export function draftToAuditPayload(draft: N8nProspectDraft): Record<string, unknown> {
  return {
    company: draft.company || {},
    contacts: draft.contacts || {},
    technology: draft.technology || {},
    seo: draft.seo || {},
    performance: draft.performance || {},
    conversion: draft.conversion || {},
    legal: draft.legal || {},
    googleBusiness: draft.googleBusiness || {},
    offer: draft.offer || {},
  };
}

export function rowToProspectView(row: OutboundProspectRow): N8nProspectDraft & { dbId: string } {
  const audit = row.audit_payload || {};
  return {
    dbId: row.id,
    id: row.external_id,
    websiteUrl: row.website_url,
    domain: row.domain,
    status: row.status,
    company: (audit.company as N8nProspectDraft['company']) || {
      name: row.company_name || undefined,
      city: row.city || undefined,
      postalCode: row.postal_code || undefined,
    },
    contacts: (audit.contacts as N8nProspectDraft['contacts']) || {
      preferredEmail: row.preferred_email || undefined,
    },
    technology: audit.technology as Record<string, unknown>,
    seo: audit.seo as Record<string, unknown>,
    performance: audit.performance as Record<string, unknown>,
    conversion: audit.conversion as Record<string, unknown>,
    legal: audit.legal as Record<string, unknown>,
    googleBusiness: audit.googleBusiness as Record<string, unknown>,
    offer: audit.offer as Record<string, unknown>,
    email: row.email_draft || {},
    sentAt: row.sent_at,
  };
}

export async function upsertProspectFromDraft(draft: N8nProspectDraft): Promise<OutboundProspectRow> {
  const client = await pool.connect();
  try {
    const audit = draftToAuditPayload(draft);
    const emailDraft = draft.email || {};
    const status = (draft.status || 'draft') as OutboundProspectStatus;
    const res = await client.query(
      `INSERT INTO outbound_prospects (
        external_id, domain, website_url, status, company_name, preferred_email,
        city, postal_code, audit_payload, email_draft, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
      ON CONFLICT (external_id) DO UPDATE SET
        domain = EXCLUDED.domain,
        website_url = EXCLUDED.website_url,
        status = EXCLUDED.status,
        company_name = EXCLUDED.company_name,
        preferred_email = EXCLUDED.preferred_email,
        city = EXCLUDED.city,
        postal_code = EXCLUDED.postal_code,
        audit_payload = EXCLUDED.audit_payload,
        email_draft = EXCLUDED.email_draft,
        updated_at = NOW()
      RETURNING *`,
      [
        draft.id,
        draft.domain || '',
        draft.websiteUrl || '',
        status,
        draft.company?.name || null,
        draft.contacts?.preferredEmail || null,
        draft.company?.city || null,
        draft.company?.postalCode || null,
        JSON.stringify(audit),
        JSON.stringify(emailDraft),
      ],
    );
    const row = mapRow(res.rows[0]);
    await linkOutboundProspect(row.id, client);
    const linked = await client.query('SELECT * FROM outbound_prospects WHERE id = $1', [row.id]);
    return mapRow(linked.rows[0]);
  } finally {
    client.release();
  }
}

export async function linkOutboundProspect(
  prospectDbId: string,
  existingClient?: import('pg').PoolClient,
): Promise<void> {
  const client = existingClient || (await pool.connect());
  const release = !existingClient;
  try {
    const res = await client.query('SELECT * FROM outbound_prospects WHERE id = $1', [prospectDbId]);
    if (!res.rows[0]) return;
    const row = mapRow(res.rows[0]);
    let customerId = row.customer_id;
    let leadId = row.lead_id;

    if (row.preferred_email && !customerId) {
      const c = await client.query(
        'SELECT id FROM customers WHERE LOWER(email) = LOWER($1) LIMIT 1',
        [row.preferred_email],
      );
      if (c.rows[0]) customerId = String(c.rows[0].id);
    }

    try {
      if (row.preferred_email && !leadId) {
        const l = await client.query(
          `SELECT id FROM funnel_leads
           WHERE LOWER(email) = LOWER($1)
              OR (existing_website_url IS NOT NULL AND existing_website_url ILIKE $2)
           ORDER BY created_at DESC LIMIT 1`,
          [row.preferred_email, `%${row.domain}%`],
        );
        if (l.rows[0]) leadId = String(l.rows[0].id);
      }

      if (!leadId && row.domain) {
        const l2 = await client.query(
          `SELECT id FROM funnel_leads
           WHERE existing_website_url IS NOT NULL AND existing_website_url ILIKE $1
           ORDER BY created_at DESC LIMIT 1`,
          [`%${row.domain}%`],
        );
        if (l2.rows[0]) leadId = String(l2.rows[0].id);
      }
    } catch (linkErr) {
      console.warn('linkOutboundProspect funnel_leads:', linkErr);
    }

    await client.query(
      `UPDATE outbound_prospects SET customer_id = $2, lead_id = $3, updated_at = NOW() WHERE id = $1`,
      [prospectDbId, customerId, leadId],
    );
  } finally {
    if (release) client.release();
  }
}

export async function listOutboundProspects(opts?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<OutboundProspectRow[]> {
  const client = await pool.connect();
  try {
    const params: unknown[] = [];
    const where: string[] = [];
    if (opts?.status) {
      params.push(opts.status);
      where.push(`status = $${params.length}`);
    }
    if (opts?.search) {
      params.push(`%${opts.search}%`);
      const i = params.length;
      where.push(`(domain ILIKE $${i} OR company_name ILIKE $${i} OR preferred_email ILIKE $${i})`);
    }
    const limit = opts?.limit || 100;
    params.push(limit);
    const sql = `
      SELECT * FROM outbound_prospects
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY created_at DESC
      LIMIT $${params.length}`;
    const res = await client.query(sql, params);
    return res.rows.map(mapRow);
  } finally {
    client.release();
  }
}

export async function getOutboundProspectById(id: string): Promise<OutboundProspectRow | null> {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM outbound_prospects WHERE id = $1', [id]);
    return res.rows[0] ? mapRow(res.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function getOutboundProspectByExternalId(externalId: string): Promise<OutboundProspectRow | null> {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM outbound_prospects WHERE external_id = $1', [externalId]);
    return res.rows[0] ? mapRow(res.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function updateOutboundProspectFromPatch(
  id: string,
  patch: {
    company?: Record<string, unknown>;
    contacts?: Record<string, unknown>;
    email?: Record<string, unknown>;
    offer?: Record<string, unknown>;
    googleBusiness?: Record<string, unknown>;
    painPoints?: string[];
    status?: OutboundProspectStatus;
  },
): Promise<OutboundProspectRow | null> {
  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT * FROM outbound_prospects WHERE id = $1', [id]);
    if (!existing.rows[0]) return null;
    const row = mapRow(existing.rows[0]);
    const audit = { ...row.audit_payload };
    if (patch.company) audit.company = { ...(audit.company as object), ...patch.company };
    if (patch.contacts) audit.contacts = { ...(audit.contacts as object), ...patch.contacts };
    if (patch.googleBusiness) audit.googleBusiness = { ...(audit.googleBusiness as object), ...patch.googleBusiness };
    if (patch.offer) audit.offer = { ...(audit.offer as object), ...patch.offer };
    if (patch.painPoints) {
      audit.offer = { ...(audit.offer as object), painPoints: patch.painPoints };
    }
    const emailDraft = { ...(row.email_draft || {}), ...(patch.email || {}) };
    const company = audit.company as Record<string, unknown> | undefined;
    const contacts = audit.contacts as Record<string, unknown> | undefined;

    const res = await client.query(
      `UPDATE outbound_prospects SET
        audit_payload = $2,
        email_draft = $3,
        company_name = COALESCE($4, company_name),
        preferred_email = COALESCE($5, preferred_email),
        city = COALESCE($6, city),
        postal_code = COALESCE($7, postal_code),
        status = COALESCE($8, status),
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [
        id,
        JSON.stringify(audit),
        JSON.stringify(emailDraft),
        company?.name || null,
        contacts?.preferredEmail || null,
        company?.city || null,
        company?.postalCode || null,
        patch.status || null,
      ],
    );
    return mapRow(res.rows[0]);
  } finally {
    client.release();
  }
}

export async function markOutboundProspectSent(
  id: string,
  sentTo: string,
  staffUserId?: string,
): Promise<OutboundProspectRow | null> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `UPDATE outbound_prospects SET
        status = 'sent',
        sent_at = NOW(),
        sent_to = $2,
        sent_by_staff_id = $3,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, sentTo, staffUserId || null],
    );
    return res.rows[0] ? mapRow(res.rows[0]) : null;
  } finally {
    client.release();
  }
}
