import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  getOutboundProspectById,
  rowToProspectView,
  updateOutboundProspectFromPatch,
} from '@/lib/outbound-database';
import { buildAuditPdfBuffer, isPdfBuffer } from '@/lib/outbound/audit-pdf';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const row = await getOutboundProspectById(id);
  if (!row) return secureResponse({ error: 'not_found' }, 404);

  const body = await request.json().catch(() => ({}));
  if (body.patch) await updateOutboundProspectFromPatch(id, body.patch);

  const freshRow = (await getOutboundProspectById(id))!;
  const prospect = rowToProspectView(freshRow);
  const pdfBuf = await buildAuditPdfBuffer(prospect);
  if (!isPdfBuffer(pdfBuf)) return secureResponse({ error: 'pdf_failed' }, 500);

  return secureResponse({ pdfBase64: pdfBuf.toString('base64') });
}
