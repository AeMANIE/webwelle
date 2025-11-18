'use client';

import dynamic from 'next/dynamic';

const AIVoiceSoundwave = dynamic(() => import('./AIVoiceSoundwave'), {
  ssr: false,
  loading: () => null,
});

export default function AIVoiceSoundwaveWrapper() {
  return <AIVoiceSoundwave />;
}

