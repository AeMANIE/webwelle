'use client';

import { useEffect, useRef } from 'react';

const { PI, sin, cos, random } = Math;

interface WorkflowAnimationProps {
    withOverlay?: boolean;
}

export default function WorkflowAnimation({ withOverlay = true }: WorkflowAnimationProps) {
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
        const cellSize = 30; // Größerer Abstand für weniger Punkte
        let mouseX = 0;
        let mouseY = 0;
        let isInteracting = false;
        const dots: Array<{ x: number; y: number; phase: number; intensity: number }> = [];

        // Mobile Detection
        const isMobile = window.innerWidth < 768;
        const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

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
            
            // Clear canvas mit dunklerem Fade für subtileren Trail-Effekt
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw dots
            dots.forEach((dot, index) => {
                const x = dot.x;
                const y = dot.y;
                
                // Berechne Grid-Position für Wave-Muster
                const gridX = index % gridWidth;
                const gridY = Math.floor(index / gridWidth);
                
                // Sanftere Wave-Muster für weniger aggressive Animation
                const dist = Math.sqrt(Math.pow(gridX - gridWidth/2, 2) + Math.pow(gridY - gridHeight/2, 2));
                
                const wave1 = sin(tickRef.current * 0.005 + dist * 0.08 + dot.phase) * 0.2;
                const wave2 = sin(tickRef.current * 0.008 + gridX * 0.15 + dot.phase) * 0.15;
                const wave3 = sin(tickRef.current * 0.006 + gridY * 0.15 + dot.phase) * 0.15;
                
                // Niedrigere Basis-Intensität für dunklere Punkte
                let intensity = 0.2 + wave1 + wave2 + wave3;
                
                // Sanfterer Interaktions-Effekt
                if (isInteracting) {
                    const dx = x - mouseX;
                    const dy = y - mouseY;
                    const distanceToMouse = Math.sqrt(dx * dx + dy * dy);
                    const maxDistance = 150; // Kleinere Reichweite
                    
                    if (distanceToMouse < maxDistance) {
                        const rippleEffect = (1 - distanceToMouse / maxDistance) * 0.6; // Weniger intensiv
                        intensity += rippleEffect;
                        
                        if (distanceToMouse < 60) {
                            intensity += 0.2; // Weniger Glow
                        }
                    }
                }
                
                intensity = Math.max(0, Math.min(1, intensity));
                dot.intensity = intensity;
                
                // Zeichne Punkt nur wenn Intensität hoch genug
                if (intensity > 0.15) {
                    // Quadrat statt Kreis für moderneren Look
                    const size = 1.5 * intensity;
                    
                    // Dunklere, grauere Farben
                    const hue = 200 + Math.sin(intensity * PI) * 5; // 195-205 = Dunkelblau-Grau
                    const saturation = 15 + intensity * 10; // Niedrige Sättigung für grauere Farben
                    const lightness = 15 + intensity * 20; // Dunklere Basis
                    const alpha = intensity * 0.7; // Transparenter
                    
                    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                    ctx.fillRect(x - size / 2, y - size / 2, size, size);
                    
                    // Subtilerer Glow für stärkere Punkte
                    if (intensity > 0.7) {
                        const glowSize = 3 * intensity;
                        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness + 5}%, ${alpha * 0.2})`;
                        ctx.fillRect(x - glowSize / 2, y - glowSize / 2, glowSize, glowSize);
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
            {/* Dunkleres Overlay für bessere Lesbarkeit */}
            {withOverlay && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[1]" style={{ pointerEvents: 'none' }} />
            )}
        </div>
    );
}
