'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const AIVoiceSoundwave = dynamic(() => import('./AIVoiceSoundwave'), {
  ssr: false,
  loading: () => null,
});

export default function AIVoiceSoundwaveWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <AIVoiceSoundwave />;
}

