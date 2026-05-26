import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { getOfferById, saveDocusealSubmission } from '@/lib/funnel-database';
import { createDocusealSubmission } from '@/lib/docuseal';
import { pool } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof Response) return auth;

  const { id: offerId } = await params;
  const { offer, items } = await getOfferById(offerId);
  if (!offer) {
    return secureResponse({ error: 'not_found' }, 404);
  }

  const client = await pool.connect();
  let lead;
  try {
    const r = await client.query('SELECT * FROM funnel_leads WHERE id = $1', [offer.lead_id]);
    lead = r.rows[0];
  } finally {
    client.release();
  }

  if (!lead?.email) {
    return secureResponse({ error: 'missing_email', message: 'Lead hat keine E-Mail' }, 400);
  }

  const templateId = process.env.DOCUSEAL_TEMPLATE_ID || '1';
  const itemLines = (items as Array<{ label: string; unit_amount_cents: number }>)
    .map((i) => `${i.label}: ${(i.unit_amount_cents / 100).toFixed(2)} EUR`)
    .join('\n');

  const submission = await createDocusealSubmission({
    templateId,
    email: lead.email,
    name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.company_name,
    fields: {
      company: lead.company_name || '',
      package: offer.package_type || '',
      total: `${(offer.total_cents / 100).toFixed(2)} EUR`,
      items: itemLines,
      valid_until: offer.valid_until ? String(offer.valid_until) : '',
    },
  });

  const signingUrl =
    submission.submitters?.[0]?.embed_src ||
    `${process.env.DOCUSEAL_BASE_URL}/s/${submission.id}`;

  await saveDocusealSubmission({
    offerId,
    submissionId: String(submission.id),
    templateId,
    submitterEmail: lead.email,
    signingUrl,
    rawPayload: submission as unknown as Record<string, unknown>,
  });

  return secureResponse({ submissionId: submission.id, signingUrl });
}
