'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { DottedSurfaceStatic } from './dotted-surface-static';

const DottedSurfaceWebGL = dynamic(
  () => import('./dotted-surface-webgl').then((m) => m.DottedSurfaceWebGL),
  { ssr: false }
);

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

const DESKTOP_QUERY = '(min-width: 1024px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const gateRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const el = gateRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry?.isIntersecting ?? false;
        setIsVisible(intersecting);
        if (intersecting) {
          setIsNearViewport(true);
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const motionMq = window.matchMedia(REDUCED_MOTION_QUERY);
    const desktopMq = window.matchMedia(DESKTOP_QUERY);

    const updateMotion = () => setPrefersReducedMotion(motionMq.matches);
    const updateDesktop = () => setIsDesktop(desktopMq.matches);

    updateMotion();
    updateDesktop();

    motionMq.addEventListener('change', updateMotion);
    desktopMq.addEventListener('change', updateDesktop);

    return () => {
      motionMq.removeEventListener('change', updateMotion);
      desktopMq.removeEventListener('change', updateDesktop);
    };
  }, []);

  const useStatic = prefersReducedMotion || !isDesktop;
  const showWebGL = isNearViewport && isDesktop && !prefersReducedMotion;

  return (
    <div
      ref={gateRef}
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      {...props}
    >
      {useStatic && <DottedSurfaceStatic className="h-full w-full" />}
      {showWebGL && <DottedSurfaceWebGL active={isVisible} className="h-full w-full" />}
    </div>
  );
}
