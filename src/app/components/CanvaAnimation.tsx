'use client';

import { useEffect, useRef } from 'react';

const { PI, sin, cos, random } = Math;

interface CanvaAnimationProps {
    withOverlay?: boolean;
}

export default function CanvaAnimation({ withOverlay = true }: CanvaAnimationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const tickRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let gridWidth = 0;
        let gridHeight = 0;
        const cellSize = 20; // Abstand zwischen Punkten
        let mouseX = 0;
        let mouseY = 0;
        let isInteracting = false;
        const dots: Array<{ x: number; y: number; phase: number; intensity: number }> = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gridWidth = Math.ceil(canvas.width / cellSize);
            gridHeight = Math.ceil(canvas.height / cellSize);
            
            // Erstelle Raster von Punkten
            dots.length = 0;
            for (let y = 0; y < gridHeight; y++) {
                for (let x = 0; x < gridWidth; x++) {
                    dots.push({
                        x: x * cellSize,
                        y: y * cellSize,
                        phase: random() * PI * 2,
                        intensity: 0
                    });
                }
            }
        };

        resize();

        const draw = () => {
            tickRef.current++;
            
            // Clear canvas mit leichtem Fade für Trail-Effekt
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw dots
            dots.forEach((dot, index) => {
                const x = dot.x;
                const y = dot.y;
                
                // Berechne Grid-Position für Wave-Muster
                const gridX = index % gridWidth;
                const gridY = Math.floor(index / gridWidth);
                
                // Wave-Muster: Mehrere überlagerte Wellen für komplexeres Muster
                const dist = Math.sqrt(Math.pow(gridX - gridWidth/2, 2) + Math.pow(gridY - gridHeight/2, 2));
                
                const wave1 = sin(tickRef.current * 0.01 + dist * 0.1 + dot.phase) * 0.3;
                const wave2 = sin(tickRef.current * 0.015 + gridX * 0.2 + dot.phase) * 0.2;
                const wave3 = sin(tickRef.current * 0.008 + gridY * 0.2 + dot.phase) * 0.2;
                const wave4 = sin(tickRef.current * 0.012 + (gridX + gridY) * 0.15 + dot.phase) * 0.15;
                
                // Basis-Intensität basierend auf Wellen
                let intensity = 0.3 + wave1 + wave2 + wave3 + wave4;
                
                // Interaktions-Effekt (Maus/Touch)
                if (isInteracting) {
                    const dx = x - mouseX;
                    const dy = y - mouseY;
                    const distanceToMouse = Math.sqrt(dx * dx + dy * dy);
                    const maxDistance = 200;
                    
                    if (distanceToMouse < maxDistance) {
                        // Stärkerer Welleneffekt von Maus-Position aus
                        const rippleEffect = (1 - distanceToMouse / maxDistance) * 1.0;
                        intensity += rippleEffect;
                        
                        // Zusätzlicher Glow-Effekt direkt am Cursor
                        if (distanceToMouse < 80) {
                            intensity += 0.3;
                        }
                    }
                }
                
                intensity = Math.max(0, Math.min(1, intensity));
                
                dot.intensity = intensity;
                
                // Zeichne Punkt nur wenn Intensität hoch genug
                if (intensity > 0.1) {
                    ctx.beginPath();
                    ctx.arc(x, y, 2 * intensity, 0, PI * 2);
                    
                    // Blaue Farbe (Cyan-Blau)
                    const hue = 190 + Math.sin(intensity * PI) * 10; // 180-200 = Cyan-Blau
                    const saturation = 80 + intensity * 20;
                    const lightness = 50 + intensity * 30;
                    const alpha = intensity;
                    
                    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                    ctx.fill();
                    
                    // Zusätzlicher Glow für stärkere Punkte
                    if (intensity > 0.6) {
                        ctx.beginPath();
                        ctx.arc(x, y, 4 * intensity, 0, PI * 2);
                        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness + 10}%, ${alpha * 0.3})`;
                        ctx.fill();
                    }
                }
            });
            
            animationRef.current = requestAnimationFrame(draw);
        };

        // Event handlers für Interaktion
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

        draw();

        const container = containerRef.current;
        if (!container) return;

        // Event listeners auf Container für bessere Touch-Unterstützung
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
        container.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('resize', resize);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (container) {
                container.removeEventListener('mousemove', handleMouseMove);
                container.removeEventListener('mouseleave', handleMouseLeave);
                container.removeEventListener('touchmove', handleTouchMove);
                container.removeEventListener('touchend', handleTouchEnd);
            }
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ background: 'transparent', pointerEvents: 'none' }}
            />
            {/* Semi-transparentes Overlay für bessere Lesbarkeit - nur wenn withOverlay true ist */}
            {withOverlay && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-[1]" style={{ pointerEvents: 'none' }} />
            )}
        </div>
    );
}
