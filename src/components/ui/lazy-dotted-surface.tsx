'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { DottedSurfaceVariant } from '@/components/ui/dotted-surface';

const DottedSurface = dynamic(
  () => import('@/components/ui/dotted-surface').then((m) => m.DottedSurface),
  { ssr: false }
);

type LazyDottedSurfaceProps = {
  variant: DottedSurfaceVariant;
  className?: string;
  rootMargin?: string;
};

export function LazyDottedSurface({
  variant,
  className,
  rootMargin = '200px',
}: LazyDottedSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {shouldLoad ? <DottedSurface variant={variant} className="h-full w-full" /> : null}
    </div>
  );
}
