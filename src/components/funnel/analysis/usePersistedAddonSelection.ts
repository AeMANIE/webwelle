'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  normalizeAddonSelection,
  type FunnelAddonSelection,
} from '@/lib/funnel/packages';

function selectionKey(selection: FunnelAddonSelection): string {
  return JSON.stringify(selection);
}

const PERSIST_DEBOUNCE_MS = 550;

export function usePersistedAddonSelection(
  token: string,
  initial: FunnelAddonSelection | null | undefined,
  onRefresh: () => void
) {
  const normalizedInitial = normalizeAddonSelection(initial);
  const [selection, setSelection] = useState<FunnelAddonSelection>(normalizedInitial);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSelectionRef = useRef<FunnelAddonSelection | null>(null);
  const lastLocalKeyRef = useRef(selectionKey(normalizedInitial));
  const isDirtyRef = useRef(false);
  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token;
    isDirtyRef.current = false;
    pendingSelectionRef.current = null;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const server = normalizeAddonSelection(initial);
    setSelection(server);
    lastLocalKeyRef.current = selectionKey(server);
  }, [token]);

  useEffect(() => {
    if (debounceRef.current || saving) return;

    const server = normalizeAddonSelection(initial);
    const serverKey = selectionKey(server);

    if (isDirtyRef.current) {
      if (serverKey !== lastLocalKeyRef.current) return;
      setSelection((prev) => (selectionKey(prev) === serverKey ? prev : server));
      return;
    }

    setSelection((prev) => {
      if (selectionKey(prev) === serverKey) return prev;
      lastLocalKeyRef.current = serverKey;
      return server;
    });
  }, [initial, saving]);

  const persist = useCallback(
    async (next: FunnelAddonSelection) => {
      if (!tokenRef.current) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/funnel/leads/${tokenRef.current}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intent: 'addon-selection',
            seoProfi: next.seoProfi,
            blogMode: next.blogMode,
            blogCount: next.blogCount,
            brandingSelected: next.brandingSelected,
            animationSelected: next.animationSelected,
          }),
        });
        if (res.ok) {
          lastLocalKeyRef.current = selectionKey(next);
          onRefresh();
        }
      } finally {
        setSaving(false);
      }
    },
    [onRefresh]
  );

  const updateSelection = useCallback(
    (updater: (prev: FunnelAddonSelection) => FunnelAddonSelection) => {
      setSelection((prev) => {
        const next = updater(prev);
        isDirtyRef.current = true;
        lastLocalKeyRef.current = selectionKey(next);
        pendingSelectionRef.current = next;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          debounceRef.current = null;
          const pending = pendingSelectionRef.current;
          if (pending) void persist(pending);
        }, PERSIST_DEBOUNCE_MS);

        return next;
      });
    },
    [persist]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { selection, setSelection: updateSelection, saving };
}
