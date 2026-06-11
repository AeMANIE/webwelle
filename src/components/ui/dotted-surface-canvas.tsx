'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import type { DottedSurfaceVariantProps } from './dotted-surface-types';

const COLS = 12;
const ROWS = 16;
const DOT_COLOR = 'rgba(230, 240, 255, 0.65)';
const DOT_RADIUS = 1.6;

export function DottedSurfaceCanvas({
  className,
  active = true,
}: DottedSurfaceVariantProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let count = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = DOT_COLOR;

      const gapX = width / (COLS + 1);
      const gapY = height / (ROWS + 1);

      for (let ix = 0; ix < COLS; ix++) {
        for (let iy = 0; iy < ROWS; iy++) {
          const baseX = gapX * (ix + 1);
          const baseY = gapY * (iy + 1);
          const waveY =
            Math.sin((ix + count) * 0.3) * 6 + Math.sin((iy + count) * 0.5) * 6;

          ctx.beginPath();
          ctx.arc(baseX, baseY + waveY, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (!activeRef.current || document.visibilityState === 'hidden') {
        return;
      }

      draw();
      count += 0.1;
    };

    resize();
    animate();

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
