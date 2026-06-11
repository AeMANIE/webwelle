'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { DottedSurfaceStatic } from './dotted-surface-static';
import type { DottedSurfaceVariantProps } from './dotted-surface-types';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

const DESKTOP_QUERY = '(min-width: 1024px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const gateRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [Variant, setVariant] = useState<ComponentType<DottedSurfaceVariantProps> | null>(
    null
  );

  useEffect(() => {
    const el = gateRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry?.isIntersecting ?? false;
        setIsVisible(intersecting);
        if (intersecting) {
          setShouldLoad(true);
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

  useEffect(() => {
    if (!shouldLoad || prefersReducedMotion) {
      setVariant(null);
      return;
    }

    let cancelled = false;

    const loadVariant = async () => {
      if (isDesktop) {
        const mod = await import('./dotted-surface-webgl');
        if (!cancelled) setVariant(() => mod.DottedSurfaceWebGL);
        return;
      }

      const mod = await import('./dotted-surface-canvas');
      if (!cancelled) setVariant(() => mod.DottedSurfaceCanvas);
    };

    void loadVariant();

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, prefersReducedMotion, isDesktop]);

  return (
    <div
      ref={gateRef}
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      {...props}
    >
      {shouldLoad && prefersReducedMotion && <DottedSurfaceStatic />}
      {shouldLoad && !prefersReducedMotion && Variant && (
        <Variant active={isVisible} className="h-full w-full" />
      )}
    </div>
  );
}
