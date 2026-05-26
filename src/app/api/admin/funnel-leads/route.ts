import { NextRequest } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import {
  listFunnelLeads,
  getResearchResults,
  getDiscountChoice,
  ensureFunnelTables,
} from '@/lib/funnel-database';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof Response) return auth;

  await ensureFunnelTables();
  const leads = await listFunnelLeads(100);

  const enriched = await Promise.all(
    leads.map(async (lead) => {
      const research = await getResearchResults(lead.id);
      const discount = await getDiscountChoice(lead.id);
      const client = await pool.connect();
      let offer = null;
      try {
        const r = await client.query(
          'SELECT * FROM offers WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1',
          [lead.id]
        );
        offer = r.rows[0] || null;
      } finally {
        client.release();
      }
      return { lead, research, discount, offer };
    })
  );

  return secureResponse({ leads: enriched });
}
