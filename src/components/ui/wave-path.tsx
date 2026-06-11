'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

type WavePathProps = React.ComponentProps<'div'> & {
  orientation?: 'horizontal' | 'vertical';
  autoAnimateOnVisible?: boolean;
};

const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

export function WavePath({
  className,
  orientation = 'horizontal',
  autoAnimateOnVisible = false,
  ...props
}: WavePathProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAutoPlayedRef = useRef(false);
  const stateRef = useRef({
    progress: 0,
    anchor: 0.2,
    time: Math.PI / 2,
    reqId: null as number | null,
    size: 300,
    isPointerDown: false,
    lastPointerX: 0,
    lastPointerY: 0,
  });

  const setPath = useCallback(
    (progress: number) => {
      const path = pathRef.current;
      if (!path) return;

      const { anchor, size } = stateRef.current;

      if (orientation === 'horizontal') {
        path.setAttributeNS(
          null,
          'd',
          `M0 100 Q${size * anchor} ${100 + progress * 0.6}, ${size} 100`,
        );
      } else {
        path.setAttributeNS(
          null,
          'd',
          `M50 0 Q${50 + progress * 0.6} ${size * anchor}, 50 ${size}`,
        );
      }
    },
    [orientation],
  );

  const resetAnimation = useCallback(() => {
    const state = stateRef.current;
    state.time = Math.PI / 2;
    state.progress = 0;
    if (state.reqId !== null) {
      cancelAnimationFrame(state.reqId);
      state.reqId = null;
    }
    setPath(0);
  }, [setPath]);

  const animateOut = useCallback(() => {
    const state = stateRef.current;
    const newProgress = state.progress * Math.sin(state.time);
    state.progress = lerp(state.progress, 0, 0.025);
    state.time += 0.2;
    setPath(newProgress);

    if (Math.abs(state.progress) > 0.75) {
      state.reqId = requestAnimationFrame(animateOut);
    } else {
      resetAnimation();
    }
  }, [setPath, resetAnimation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      stateRef.current.size = Math.max(
        orientation === 'horizontal' ? rect.width : rect.height,
        1,
      );
      setPath(stateRef.current.progress);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (stateRef.current.reqId !== null) {
        cancelAnimationFrame(stateRef.current.reqId);
      }
    };
  }, [orientation, setPath]);

  const playGentleWaveOnce = useCallback(() => {
    if (hasAutoPlayedRef.current) return;
    hasAutoPlayedRef.current = true;

    const state = stateRef.current;
    if (state.reqId !== null) {
      cancelAnimationFrame(state.reqId);
      state.reqId = null;
    }

    state.anchor = 0.45;
    let frame = 0;
    const totalFrames = 48;

    const animateIn = () => {
      frame += 1;
      const t = frame / totalFrames;
      state.progress = Math.sin(t * Math.PI) * 42;
      setPath(state.progress);

      if (frame < totalFrames) {
        state.reqId = requestAnimationFrame(animateIn);
      } else {
        state.reqId = null;
        animateOut();
      }
    };

    animateIn();
  }, [setPath, animateOut]);

  useEffect(() => {
    if (!autoAnimateOnVisible || orientation !== 'vertical') return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          playGentleWaveOnce();
        }
      },
      { threshold: [0.45, 0.6] },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [autoAnimateOnVisible, orientation, playGentleWaveOnce]);

  const cancelOutAnimation = () => {
    const state = stateRef.current;
    if (state.reqId !== null) {
      cancelAnimationFrame(state.reqId);
      state.reqId = null;
      resetAnimation();
    }
  };

  const applyWaveFromClient = useCallback(
    (clientX: number, clientY: number, deltaX: number, deltaY: number) => {
      const state = stateRef.current;
      const path = pathRef.current;
      if (!path) return;

      const pathBound = path.getBoundingClientRect();

      if (orientation === 'horizontal') {
        state.anchor = (clientX - pathBound.left) / pathBound.width;
        state.progress += deltaY;
      } else {
        state.anchor = (clientY - pathBound.top) / pathBound.height;
        state.progress += deltaX;
      }

      setPath(state.progress);
    },
    [orientation, setPath],
  );

  const handleMouseEnter = () => {
    cancelOutAnimation();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    applyWaveFromClient(e.clientX, e.clientY, e.movementX, e.movementY);
  };

  const handleMouseLeave = () => {
    animateOut();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (orientation === 'horizontal' && e.pointerType === 'mouse') return;

    const state = stateRef.current;
    state.isPointerDown = true;
    state.lastPointerX = e.clientX;
    state.lastPointerY = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
    cancelOutAnimation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (orientation === 'horizontal' && e.pointerType === 'mouse') return;

    const state = stateRef.current;
    if (!state.isPointerDown) return;

    const deltaX = e.clientX - state.lastPointerX;
    const deltaY = e.clientY - state.lastPointerY;

    applyWaveFromClient(e.clientX, e.clientY, deltaX, deltaY);

    state.lastPointerX = e.clientX;
    state.lastPointerY = e.clientY;
  };

  const handlePointerUp = () => {
    stateRef.current.isPointerDown = false;
    animateOut();
  };

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative',
        isHorizontal ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    >
      <div
        onMouseEnter={isHorizontal ? handleMouseEnter : undefined}
        onMouseMove={isHorizontal ? handleMouseMove : undefined}
        onMouseLeave={isHorizontal ? handleMouseLeave : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          'relative z-10',
          isHorizontal
            ? '-top-5 h-10 w-full hover:-top-[150px] hover:h-[300px] [@media(pointer:coarse)]:-top-[150px] [@media(pointer:coarse)]:h-[300px]'
            : 'absolute inset-y-0 -left-5 h-full w-10',
        )}
        style={{ touchAction: 'none' }}
      />
      <svg
        className={cn(
          'pointer-events-none absolute',
          isHorizontal
            ? '-top-[100px] h-[300px] w-full'
            : '-left-[49px] h-full w-[100px]',
        )}
      >
        <path
          ref={pathRef}
          className="fill-none"
          stroke="#ffffff"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}
