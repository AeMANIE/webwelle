'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isWachstumsarchitekturLead } from '@/lib/funnel/funnel-kind';

export function useDwaLeadGuard(
  token: string,
  lead: { funnel_kind?: string } | null,
  loaded: boolean
) {
  const router = useRouter();

  useEffect(() => {
    if (!loaded || !token || !lead) return;
    if (!isWachstumsarchitekturLead(lead)) {
      router.replace(`/funnel-2?t=${encodeURIComponent(token)}`);
    }
  }, [lead, loaded, router, token]);
}

export function useStarterwelleLeadGuard(
  token: string,
  lead: { funnel_kind?: string } | null,
  loaded: boolean
) {
  const router = useRouter();

  useEffect(() => {
    if (!loaded || !token || !lead) return;
    if (isWachstumsarchitekturLead(lead)) {
      router.replace(`/funnel-dw/2?t=${encodeURIComponent(token)}`);
    }
  }, [lead, loaded, router, token]);
}
