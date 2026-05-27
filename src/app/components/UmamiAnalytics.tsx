'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getUmamiConfig,
  hasStatisticsConsent,
  isUmamiTrackingPath,
  UMAMI_CONSENT_EVENT,
} from '@/lib/umami';

const umamiConfig = getUmamiConfig();

export default function UmamiAnalytics() {
  const pathname = usePathname();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const updateTrackingState = () => {
      setShouldLoad(
        Boolean(umamiConfig) &&
          hasStatisticsConsent() &&
          isUmamiTrackingPath(pathname)
      );
    };

    updateTrackingState();
    window.addEventListener(UMAMI_CONSENT_EVENT, updateTrackingState);

    return () => {
      window.removeEventListener(UMAMI_CONSENT_EVENT, updateTrackingState);
    };
  }, [pathname]);

  if (!umamiConfig || !shouldLoad) {
    return null;
  }

  return (
    <Script
      src={umamiConfig.scriptUrl}
      data-website-id={umamiConfig.websiteId}
      strategy="afterInteractive"
      defer
    />
  );
}
