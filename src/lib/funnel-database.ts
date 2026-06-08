import crypto from 'crypto';
import { pool } from './database';
import type {
  DachMarket,
  DeliveryWindow,
  FunnelLead,
  FunnelLeadStatus,
  FunnelResearchResult,
} from './funnel/types';
import {
  normalizeAddonSelection,
  normalizeDesignPreferences,
  type FunnelAddonSelection,
  type FunnelDesignPreferences,
} from './funnel/packages';

export function generateLeadToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export async function ensureFunnelTables(): Promise<void> {
  const client = await pool.connect();
  try {
    const fs = await import('fs');
    const path = await import('path');
    const sqlPath = path.join(process.cwd(), 'info/database/funnel_tables.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await client.query(sql);
    }

    await client.query(`
      ALTER TABLE funnel_leads ADD COLUMN IF NOT EXISTS existing_website BOOLEAN;
      ALTER TABLE funnel_leads ADD COLUMN IF NOT EXISTS existing_website_url TEXT;
      ALTER TABLE funnel_leads ADD COLUMN IF NOT EXISTS addon_selection JSONB;
      ALTER TABLE funnel_leads ADD COLUMN IF NOT EXISTS design_preferences JSONB;
    `);
  } catch (e) {
    console.warn('Funnel tables migration:', e);
  } finally {
    client.release();
  }
}

function mapLead(row: Record<string, unknown>): FunnelLead {
  return {
    id: row.id as string,
    token: row.token as string,
    status: row.status as FunnelLeadStatus,
    source: (row.source as string) || 'homepage_hero',
    market: row.market as DachMarket | null,
    market_auto_detected: Boolean(row.market_auto_detected),
    country: row.country as string | null,
    postal_code: row.postal_code as string | null,
    city: row.city as string | null,
    industry_raw: row.industry_raw as string | null,
    industry_normalized: row.industry_normalized as string | null,
    industry_detail: row.industry_detail as string | null,
    industry_confidence: row.industry_confidence != null ? Number(row.industry_confidence) : null,
    geo_lat: row.geo_lat != null ? Number(row.geo_lat) : null,
    geo_lng: row.geo_lng != null ? Number(row.geo_lng) : null,
    first_name: row.first_name as string | null,
    last_name: row.last_name as string | null,
    company_name: row.company_name as string | null,
    email: row.email as string | null,
    phone: row.phone as string | null,
    street: row.street as string | null,
    house_number: row.house_number as string | null,
    address_verified: Boolean(row.address_verified),
    email_verified_at: row.email_verified_at ? new Date(row.email_verified_at as string) : null,
    phone_verified_at: row.phone_verified_at ? new Date(row.phone_verified_at as string) : null,
    selected_package: row.selected_package as string | null,
    selected_modules: (row.selected_modules as unknown[]) || [],
    wants_custom_offer: Boolean(row.wants_custom_offer),
    design_reference_urls: (row.design_reference_urls as string[]) || [],
    addon_selection: row.addon_selection
      ? normalizeAddonSelection(row.addon_selection)
      : null,
    design_preferences: row.design_preferences
      ? normalizeDesignPreferences(row.design_preferences)
      : null,
    existing_website:
      row.existing_website != null ? Boolean(row.existing_website) : null,
    existing_website_url: (row.existing_website_url as string | null) || null,
    customer_id: row.customer_id as string | null,
    created_at: new Date(row.created_at as string),
    updated_at: new Date(row.updated_at as string),
    expires_at: new Date(row.expires_at as string),
  };
}

export async function createFunnelLead(params: {
  industryRaw: string;
  industryNormalized: string;
  industryConfidence: number;
  source?: string;
  market?: DachMarket | null;
  country?: string | null;
  marketAutoDetected?: boolean;
  geoLat?: number;
  geoLng?: number;
}): Promise<FunnelLead> {
  const token = generateLeadToken();
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO funnel_leads (
        token, status, source, market, market_auto_detected, country,
        industry_raw, industry_normalized, industry_confidence, geo_lat, geo_lng
      ) VALUES ($1, 'new', $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        token,
        params.source || 'homepage_hero',
        params.market || null,
        Boolean(params.marketAutoDetected),
        params.country || params.market || null,
        params.industryRaw,
        params.industryNormalized,
        params.industryConfidence,
        params.geoLat ?? null,
        params.geoLng ?? null,
      ]
    );
    return mapLead(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function getFunnelLeadByToken(token: string): Promise<FunnelLead | null> {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM funnel_leads WHERE token = $1', [token]);
    return result.rows[0] ? mapLead(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function getFunnelLeadById(id: string): Promise<FunnelLead | null> {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM funnel_leads WHERE id = $1', [id]);
    return result.rows[0] ? mapLead(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function updateFunnelLead(
  token: string,
  updates: Partial<{
    status: FunnelLeadStatus;
    market: DachMarket;
    market_auto_detected: boolean;
    country: string;
    postal_code: string;
    city: string;
    first_name: string;
    last_name: string;
    company_name: string;
    email: string;
    phone: string;
    street: string;
    house_number: string;
    address_verified: boolean;
    email_verified_at: Date;
    selected_package: string;
    selected_modules: unknown[];
    wants_custom_offer: boolean;
    design_reference_urls: string[];
    addon_selection: FunnelAddonSelection | null;
    design_preferences: FunnelDesignPreferences | null;
    existing_website: boolean | null;
    existing_website_url: string | null;
    customer_id: string;
    industry_raw: string;
    industry_normalized: string;
    industry_detail?: string;
    industry_confidence: number;
  }>
): Promise<FunnelLead | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = $${i++}`);
      values.push(
        key === 'selected_modules' ||
        key === 'design_reference_urls' ||
        key === 'addon_selection' ||
        key === 'design_preferences'
          ? JSON.stringify(value)
          : value
      );
    }
  }
  if (fields.length === 0) return getFunnelLeadByToken(token);

  fields.push(`updated_at = NOW()`);
  values.push(token);

  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE funnel_leads SET ${fields.join(', ')} WHERE token = $${i} RETURNING *`,
      values
    );
    return result.rows[0] ? mapLead(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function upsertResearchResult(
  leadId: string,
  workflowKey: string,
  status: string,
  payload: Record<string, unknown> | null,
  errorMessage?: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO funnel_research_results (lead_id, workflow_key, status, payload, error_message, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (lead_id, workflow_key)
       DO UPDATE SET status = $3, payload = $4, error_message = $5, updated_at = NOW()`,
      [leadId, workflowKey, status, payload ? JSON.stringify(payload) : null, errorMessage || null]
    );
  } finally {
    client.release();
  }
}

export async function getResearchResults(leadId: string): Promise<FunnelResearchResult[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM funnel_research_results WHERE lead_id = $1 ORDER BY workflow_key',
      [leadId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      lead_id: row.lead_id,
      workflow_key: row.workflow_key,
      status: row.status,
      payload: row.payload,
      error_message: row.error_message,
      updated_at: new Date(row.updated_at),
    }));
  } finally {
    client.release();
  }
}

export async function saveDiscountChoice(
  leadId: string,
  deliveryWindow: DeliveryWindow,
  discountCents: number
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO funnel_discount_choices (lead_id, delivery_window, discount_cents)
       VALUES ($1, $2, $3)
       ON CONFLICT (lead_id) DO UPDATE SET delivery_window = $2, discount_cents = $3, selected_at = NOW()`,
      [leadId, deliveryWindow, discountCents]
    );
  } finally {
    client.release();
  }
}

export async function getDiscountChoice(leadId: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM funnel_discount_choices WHERE lead_id = $1',
      [leadId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function listFunnelLeads(limit = 50): Promise<FunnelLead[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM funnel_leads ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows.map(mapLead);
  } finally {
    client.release();
  }
}

export async function createOfferFromLead(params: {
  leadId: string;
  packageType: string;
  isCustom: boolean;
  title: string;
  subtotalCents: number;
  discountCents: number;
  monthlyCents?: number;
  items?: Array<{
    label: string;
    description?: string;
    unitAmountCents: number;
    billing?: string;
  }>;
  createdBy?: string;
}): Promise<{ id: string }> {
  const total = Math.max(0, params.subtotalCents - params.discountCents);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const offerResult = await client.query(
      `INSERT INTO offers (
        lead_id, status, package_type, is_custom, title,
        subtotal_cents, discount_cents, total_cents, monthly_cents, created_by
      ) VALUES ($1, 'draft', $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        params.leadId,
        params.packageType,
        params.isCustom,
        params.title,
        params.subtotalCents,
        params.discountCents,
        total,
        params.monthlyCents ?? null,
        params.createdBy ?? 'admin',
      ]
    );
    const offerId = offerResult.rows[0].id as string;

    if (params.items?.length) {
      for (let idx = 0; idx < params.items.length; idx++) {
        const item = params.items[idx];
        await client.query(
          `INSERT INTO offer_items (offer_id, label, description, unit_amount_cents, billing, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            offerId,
            item.label,
            item.description || null,
            item.unitAmountCents,
            item.billing || 'one_time',
            idx,
          ]
        );
      }
    }

    await client.query('COMMIT');
    return { id: offerId };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getOfferById(offerId: string) {
  const client = await pool.connect();
  try {
    const offer = await client.query('SELECT * FROM offers WHERE id = $1', [offerId]);
    const items = await client.query(
      'SELECT * FROM offer_items WHERE offer_id = $1 ORDER BY sort_order',
      [offerId]
    );
    return { offer: offer.rows[0], items: items.rows };
  } finally {
    client.release();
  }
}

export async function updateOfferStatus(offerId: string, status: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE offers SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, offerId]
    );
  } finally {
    client.release();
  }
}

export async function saveDocusealSubmission(params: {
  offerId: string;
  submissionId: string;
  templateId: string;
  submitterEmail: string;
  signingUrl: string;
  rawPayload: Record<string, unknown>;
}): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO docuseal_submissions (
        offer_id, docuseal_submission_id, docuseal_template_id,
        submitter_email, signing_url, status, sent_at, raw_payload
      ) VALUES ($1, $2, $3, $4, $5, 'sent', NOW(), $6)`,
      [
        params.offerId,
        params.submissionId,
        params.templateId,
        params.submitterEmail,
        params.signingUrl,
        JSON.stringify(params.rawPayload),
      ]
    );
    await client.query(
      `UPDATE offers SET status = 'sent', updated_at = NOW() WHERE id = $1`,
      [params.offerId]
    );
  } finally {
    client.release();
  }
}

export async function getOfferByDocusealSubmissionId(submissionId: string) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT o.*, d.docuseal_submission_id
       FROM docuseal_submissions d
       JOIN offers o ON o.id = d.offer_id
       WHERE d.docuseal_submission_id = $1`,
      [submissionId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function markDocusealCompleted(submissionId: string): Promise<string | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE docuseal_submissions SET status = 'completed', completed_at = NOW()
       WHERE docuseal_submission_id = $1
       RETURNING offer_id`,
      [submissionId]
    );
    const offerId = result.rows[0]?.offer_id as string | undefined;
    if (offerId) {
      await client.query(
        `UPDATE offers SET status = 'signed', updated_at = NOW() WHERE id = $1`,
        [offerId]
      );
    }
    return offerId || null;
  } finally {
    client.release();
  }
}
