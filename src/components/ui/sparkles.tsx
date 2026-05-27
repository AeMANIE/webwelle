'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  opacityDelta: number;
  speedX: number;
  speedY: number;
}

function createParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 1.2 + 0.3,
    opacity: Math.random(),
    opacityDelta: (Math.random() * 0.008 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
    speedX: (Math.random() - 0.5) * 0.3,
    speedY: (Math.random() - 0.5) * 0.3,
  };
}

interface SparklesCoreProps {
  className?: string;
  particleColor?: string;
  particleDensity?: number;
}

function SparklesCanvas({ className = '', particleColor = '#ffffff', particleDensity = 120 }: SparklesCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particles = Array.from({ length: particleDensity }, () =>
        createParticle(canvas.width, canvas.height)
      );
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += p.opacityDelta;

        if (p.opacity <= 0 || p.opacity >= 1) p.opacityDelta *= -1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor + Math.round(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [particleColor, particleDensity]);

  return <canvas ref={canvasRef} className={`w-full h-full ${className}`} />;
}

export function Sparkles({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <div className="relative z-20">{children}</div>

      <div className="relative w-full h-40 -mt-1 overflow-hidden">
        <div
          className="absolute top-0 inset-x-0 mx-auto"
          style={{
            height: '2px',
            width: '75%',
            background:
              'linear-gradient(90deg, transparent 0%, #38bdf8 20%, #22d3ee 50%, #38bdf8 80%, transparent 100%)',
            boxShadow:
              '0 0 6px 1px #38bdf8cc, 0 0 20px 4px #38bdf866, 0 0 60px 10px #0ea5e922',
          }}
        />
        <SparklesCanvas
          className="absolute inset-0"
          particleColor="#ffffff"
          particleDensity={100}
        />
      </div>
    </div>
  );
}
