import { cn } from '@/lib/utils';
import type { DottedSurfaceVariantProps } from './dotted-surface-types';

export function DottedSurfaceStatic({ className }: DottedSurfaceVariantProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      style={{
        backgroundImage:
          'radial-gradient(circle, rgba(230, 240, 255, 0.7) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
      aria-hidden
    />
  );
}
