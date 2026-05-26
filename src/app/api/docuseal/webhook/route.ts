import { NextRequest } from 'next/server';
import { markDocusealCompleted } from '@/lib/funnel-database';
import { secureResponse } from '@/lib/api-security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body.event_type || body.type || body.status;
    const submissionId = String(
      body.submission_id || body.data?.submission_id || body.id || ''
    );

    if (
      submissionId &&
      (eventType === 'submission.completed' ||
        eventType === 'completed' ||
        body.status === 'completed')
    ) {
      const offerId = await markDocusealCompleted(submissionId);
      return secureResponse({ ok: true, offerId });
    }

    return secureResponse({ ok: true, ignored: true });
  } catch (error) {
    console.error('DocuSeal webhook:', error);
    return secureResponse({ error: 'webhook_error' }, 500);
  }
}
