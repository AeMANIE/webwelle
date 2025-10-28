'use client';

import { useEffect, useRef } from 'react';

const { PI, sin, random } = Math;

// Feste Zielgröße für das Display 1206 x 2622 (Höhe x Breite)
const TARGET_HEIGHT = 1206;
const TARGET_WIDTH = 2622;

interface CanvaAnimationFixedProps {
    withOverlay?: boolean;
}

export default function CanvaAnimation_2622x1206({ withOverlay = true }: CanvaAnimationFixedProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const tickRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let gridWidth = 0;
        let gridHeight = 0;
        const cellSize = 20; // Abstand zwischen Punkten
        let mouseX = 0;
        let mouseY = 0;
        let isInteracting = false;
        const dots: Array<{ x: number; y: number; phase: number; intensity: number }> = [];

        const initFixedSize = () => {
            canvas.width = TARGET_WIDTH;
            canvas.height = TARGET_HEIGHT;
            gridWidth = Math.ceil(TARGET_WIDTH / cellSize);
            gridHeight = Math.ceil(TARGET_HEIGHT / cellSize);

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

        initFixedSize();

        const draw = () => {
            tickRef.current++;

            // Clear canvas mit leichtem Fade für Trail-Effekt
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

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

                    // Dunkelblau-Grau statt hellblau
                    const hue = 210; // Blau statt Cyan-Blau
                    const saturation = 25 + intensity * 15; // Niedrigere Sättigung (25-40%)
                    const lightness = 20 + intensity * 15; // Dunkler (20-35%)
                    const alpha = intensity * 0.8; // Etwas weniger transparent

                    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                    ctx.fill();

                    // Zusätzlicher Glow für stärkere Punkte - Dunkelblau-Grau
                    if (intensity > 0.6) {
                        ctx.beginPath();
                        ctx.arc(x, y, 4 * intensity, 0, PI * 2);
                        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness + 3}%, ${alpha * 0.25})`;
                        ctx.fill();
                    }
                }
            });

            animationRef.current = requestAnimationFrame(draw);
        };

        // Event handlers für Interaktion - Koordinaten auf Canvas-Größe skalieren
        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const relativeX = (e.clientX - rect.left) / rect.width;
            const relativeY = (e.clientY - rect.top) / rect.height;
            mouseX = relativeX * TARGET_WIDTH;
            mouseY = relativeY * TARGET_HEIGHT;
            isInteracting = true;
        };

        const handleMouseLeave = () => {
            isInteracting = false;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                const rect = container.getBoundingClientRect();
                const relativeX = (e.touches[0].clientX - rect.left) / rect.width;
                const relativeY = (e.touches[0].clientY - rect.top) / rect.height;
                mouseX = relativeX * TARGET_WIDTH;
                mouseY = relativeY * TARGET_HEIGHT;
                isInteracting = true;
            }
        };

        const handleTouchEnd = () => {
            isInteracting = false;
        };

        draw();

        // Event listeners auf Container (feste Fläche)
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    // Aspect Ratio berechnen
    const aspectRatio = TARGET_WIDTH / TARGET_HEIGHT; // 2622 / 1206 = 2.175

    return (
        <div
            ref={containerRef}
            className="relative w-full"
            style={{ 
                aspectRatio: `${aspectRatio}`,
                maxWidth: '100%',
                maxHeight: '100%',
                overflow: 'hidden'
            }}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
                style={{ width: '100%', height: '100%', background: 'transparent', pointerEvents: 'none' }}
            />
            {/* Semi-transparentes Overlay für bessere Lesbarkeit - nur wenn withOverlay true ist */}
            {withOverlay && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-[1]" style={{ pointerEvents: 'none' }} />
            )}
        </div>
    );
}


