import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { sendEmail } from '@/lib/email';
import {
  getOutboundProspectById,
  markOutboundProspectSent,
  rowToProspectView,
  updateOutboundProspectFromPatch,
} from '@/lib/outbound-database';
import { buildAuditPdfBuffer } from '@/lib/outbound/audit-pdf';
import { renderOutboundEmailHtml } from '@/lib/outbound/offer-render';
import { n8nPatchDraft } from '@/lib/outbound/n8n-client';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { id } = await ctx.params;
  const row = await getOutboundProspectById(id);
  if (!row) return secureResponse({ error: 'not_found' }, 404);

  const body = await request.json().catch(() => ({}));
  const to = String(body.to || row.preferred_email || '').trim();
  if (!to) return secureResponse({ error: 'no_recipient', message: 'Empfänger-E-Mail fehlt' }, 400);

  if (body.patch) {
    await updateOutboundProspectFromPatch(id, body.patch);
    try {
      await n8nPatchDraft(row.external_id, body.patch);
    } catch { /* */ }
  }

  const freshRow = (await getOutboundProspectById(id))!;
  const prospect = rowToProspectView(freshRow);
  const subject = String(body.subject || prospect.email?.subject || `Kurzanalyse ${prospect.domain}`);
  const html = body.html || renderOutboundEmailHtml({ ...prospect, email: { ...prospect.email, subject } });

  const pdfBuf = await buildAuditPdfBuffer(prospect);

  await sendEmail({
    to,
    subject,
    html,
    attachments: [{
      filename: `WebWelle-Audit-${prospect.domain || 'Kunde'}.pdf`,
      content: pdfBuf,
      contentType: 'application/pdf',
    }],
  });

  await markOutboundProspectSent(id, to, user.id);

  return secureResponse({ ok: true, sentTo: to });
}
