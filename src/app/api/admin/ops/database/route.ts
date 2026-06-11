import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { collectDatabaseOpsReport } from '@/lib/database-ops';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const report = await collectDatabaseOpsReport();
    return secureResponse({ success: true, report });
  } catch (error) {
    console.error('DB Ops Report Fehler:', error);
    return secureResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      },
      500
    );
  }
}
