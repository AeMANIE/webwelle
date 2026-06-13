'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function Funnel6Redirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('t') || '';

  useEffect(() => {
    router.replace(token ? `/funnel-5?t=${encodeURIComponent(token)}` : '/');
  }, [router, token]);

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Weiterleitung…
    </div>
  );
}

export default function Funnel6Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Laden…
        </div>
      }
    >
      <Funnel6Redirect />
    </Suspense>
  );
}
