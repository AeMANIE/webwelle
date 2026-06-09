'use client';

import { useEffect } from 'react';
import {
  consumePendingScrollTarget,
  scrollToAnchorWithRetry,
} from '@/lib/scroll-to-anchor';

export default function HashScrollHandler() {
  useEffect(() => {
    const handle = () => {
      const pending = consumePendingScrollTarget();
      const hash = window.location.hash.replace(/^#/, '');
      const target = pending || hash;
      if (target) scrollToAnchorWithRetry(target);
    };

    handle();
    window.addEventListener('hashchange', handle);
    return () => window.removeEventListener('hashchange', handle);
  }, []);

  return null;
}
