'use client';

import { useEffect, useRef } from 'react';

const { PI, sin, random, sqrt } = Math;

interface Dot {
  x: number;
  y: number;
  phase: number;
  intensity: number;
}

export default function WorkflowCanvasAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  
  let tick = 0;
  let gridWidth = 0;
  let gridHeight = 0;
  const cellSize = 20;
  let mouseX = 0;
  let mouseY = 0;
  let isInteracting = false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gridWidth = Math.ceil(canvas.width / cellSize);
      gridHeight = Math.ceil(canvas.height / cellSize);
      
      // Create grid of dots
      dotsRef.current = [];
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          dotsRef.current.push({
            x: x * cellSize,
            y: y * cellSize,
            phase: random() * PI * 2,
            intensity: 0
          });
        }
      }
    };

    const animate = () => {
      tick++;
      
      // Clear canvas with light fade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw dots
      dotsRef.current.forEach((dot, index) => {
        const x = dot.x;
        const y = dot.y;
        
        // Calculate grid position for wave pattern
        const gridX = index % gridWidth;
        const gridY = Math.floor(index / gridWidth);
        
        // Wave pattern: multiple overlapping waves
        const dist = sqrt(Math.pow(gridX - gridWidth/2, 2) + Math.pow(gridY - gridHeight/2, 2));
        
        const wave1 = sin(tick * 0.01 + dist * 0.1 + dot.phase) * 0.3;
        const wave2 = sin(tick * 0.015 + gridX * 0.2 + dot.phase) * 0.2;
        const wave3 = sin(tick * 0.008 + gridY * 0.2 + dot.phase) * 0.2;
        const wave4 = sin(tick * 0.012 + (gridX + gridY) * 0.15 + dot.phase) * 0.15;
        
        // Base intensity based on waves
        let intensity = 0.3 + wave1 + wave2 + wave3 + wave4;
        
        // Interaction effect (mouse)
        if (isInteracting) {
          const dx = x - mouseX;
          const dy = y - mouseY;
          const distanceToMouse = sqrt(dx * dx + dy * dy);
          const maxDistance = 200;
          
          if (distanceToMouse < maxDistance) {
            // Stronger wave effect from mouse position
            const rippleEffect = (1 - distanceToMouse / maxDistance) * 1.0;
            intensity += rippleEffect;
            
            // Additional glow effect directly at cursor
            if (distanceToMouse < 80) {
              intensity += 0.3;
            }
          }
        }
        
        intensity = Math.max(0, Math.min(1, intensity));
        
        dot.intensity = intensity;
        
        // Draw dot only if intensity is high enough
        if (intensity > 0.1) {
          ctx.beginPath();
          ctx.arc(x, y, 2 * intensity, 0, PI * 2);
          
          // Blue color (Cyan-Blue)
          const hue = 190 + sin(intensity * PI) * 10;
          const saturation = 80 + intensity * 20;
          const lightness = 50 + intensity * 30;
          const alpha = intensity;
          
          ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
          ctx.fill();
          
          // Additional glow for stronger dots
          if (intensity > 0.6) {
            ctx.beginPath();
            ctx.arc(x, y, 4 * intensity, 0, PI * 2);
            ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness + 10}%, ${alpha * 0.3})`;
            ctx.fill();
          }
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Event handlers for interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isInteracting = true;
    };

    const handleMouseLeave = () => {
      isInteracting = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.touches[0].clientX - rect.left;
        mouseY = e.touches[0].clientY - rect.top;
        isInteracting = true;
      }
    };

    const handleTouchEnd = () => {
      isInteracting = false;
    };

    // Initialize
    resize();
    animate();

    // Event listeners
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ 
        background: 'radial-gradient(ellipse at center, #0a0015 0%, #000 100%)',
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        imageRendering: '-webkit-optimize-contrast'
      }}
    />
  );
}

