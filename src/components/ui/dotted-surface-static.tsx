import { cn } from '@/lib/utils';
import type { DottedSurfaceVariantProps } from './dotted-surface-types';

export function DottedSurfaceStatic({ className }: DottedSurfaceVariantProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 z-0 opacity-65', className)}
      style={{
        backgroundImage:
          'radial-gradient(circle, rgba(230, 240, 255, 0.55) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
      aria-hidden
    />
  );
}
