import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  ensureOutboundTables,
  getOutboundProspectById,
  rowToProspectView,
  updateOutboundProspectFromPatch,
  upsertProspectFromDraft,
  type N8nProspectDraft,
} from '@/lib/outbound-database';
import { n8nGetDraft, n8nPatchDraft } from '@/lib/outbound/n8n-client';

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  await ensureOutboundTables();
  const { id } = await ctx.params;
  const row = await getOutboundProspectById(id);
  if (!row) return secureResponse({ error: 'not_found' }, 404);

  let n8nDraft: Record<string, unknown> | null = null;
  try {
    n8nDraft = await n8nGetDraft(row.external_id);
  } catch {
    /* n8n cache optional */
  }

  return secureResponse({
    prospect: rowToProspectView(row),
    row,
    n8nDraft,
  });
}

export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  await ensureOutboundTables();
  const { id } = await ctx.params;
  const row = await getOutboundProspectById(id);
  if (!row) return secureResponse({ error: 'not_found' }, 404);

  const body = await request.json().catch(() => ({}));
  const patch = body.patch || body;

  try {
    await n8nPatchDraft(row.external_id, patch);
  } catch (e) {
    console.warn('n8n patch failed, DB-only update:', e);
  }

  const updated = await updateOutboundProspectFromPatch(id, patch);
  if (!updated) return secureResponse({ error: 'update_failed' }, 500);

  try {
    const fresh = await n8nGetDraft(row.external_id);
    await upsertProspectFromDraft(fresh as unknown as N8nProspectDraft);
  } catch { /* */ }

  const finalRow = await getOutboundProspectById(id);
  return secureResponse({ ok: true, prospect: finalRow ? rowToProspectView(finalRow) : null });
}
