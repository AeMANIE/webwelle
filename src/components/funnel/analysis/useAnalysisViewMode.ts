'use client';

import { useEffect, useState } from 'react';
import { isStaffRoleName } from '@/lib/rbac';

export type AnalysisViewMode = 'customer' | 'admin';

export function useAnalysisViewMode(): AnalysisViewMode {
  const [mode, setMode] = useState<AnalysisViewMode>('customer');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/verify', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.user?.role) return;
        if (isStaffRoleName(String(data.user.role))) {
          setMode('admin');
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return mode;
}
