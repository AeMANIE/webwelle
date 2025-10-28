'use client';

import { useEffect, useRef } from 'react';

const { PI, sin, random } = Math;

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
        const cellSize = 50; // Größerer Abstand für weniger Punkte und bessere Performance
        let mouseX = 0;
        let mouseY = 0;
        let isInteracting = false;
        const dots: Array<{ x: number; y: number; phase: number; intensity: number }> = [];

        // Mobile Detection mit Performance-Optimierung
        const isMobile = window.innerWidth < 768;
        const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        
        // Performance-Level basierend auf Gerät
        const performanceLevel = isMobile ? (isLowEndDevice ? 'low' : 'medium') : 'high';
        const targetFPS = performanceLevel === 'low' ? 30 : performanceLevel === 'medium' ? 45 : 60;
        const frameSkip = performanceLevel === 'low' ? 2 : performanceLevel === 'medium' ? 1 : 0;

        const resize = () => {
            // Verwende requestAnimationFrame für bessere Performance
            requestAnimationFrame(() => {
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
            });
        };

        resize();

        const draw = () => {
            tickRef.current++;
            
            // Frame-Skipping für bessere Performance auf mobilen Geräten
            if (frameSkip > 0 && tickRef.current % (frameSkip + 1) !== 0) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            // Verwende clearRect für bessere Performance
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Optimierte Wellen-Berechnung
            const waveSpeed = 0.003; // Etwas schnellere Wellen für bessere Sichtbarkeit
            const waveComplexity = performanceLevel === 'low' ? 0.5 : performanceLevel === 'medium' ? 0.7 : 0.9;
            
            dots.forEach(dot => {
                const distance = isInteracting ? 
                    Math.sqrt((dot.x - mouseX) ** 2 + (dot.y - mouseY) ** 2) : 0;
                
                // Reduzierte Berechnungen für bessere Performance
                const wave = sin(dot.phase + tickRef.current * waveSpeed) * waveComplexity;
                const mouseEffect = isInteracting ? Math.max(0, 1 - distance / 200) : 0;
                
                dot.intensity = Math.min(1, wave * 0.6 + mouseEffect * 0.8);
                
                if (dot.intensity > 0.02) {
                    // Optimierte Farbberechnung - sichtbarer aber immer noch subtil
                    const hue = 200; // Dunkelblau-Grau
                    const saturation = Math.min(25 + dot.intensity * 12, 35);
                    const lightness = Math.min(18 + dot.intensity * 20, 38);
                    const alpha = dot.intensity * 0.8;
                    
                    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                    
                    // Zeichne Quadrat statt Kreis für bessere Performance
                    const size = 2 + dot.intensity * 3;
                    ctx.fillRect(dot.x - size/2, dot.y - size/2, size, size);
                }
            });
            
            animationRef.current = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            mouseX = touch.clientX - rect.left;
            mouseY = touch.clientY - rect.top;
        };

        const handleMouseEnter = () => {
            isInteracting = true;
        };

        const handleMouseLeave = () => {
            isInteracting = false;
        };

        // Event Listeners mit Passiv-Option für bessere Performance
        window.addEventListener('resize', resize, { passive: true });
        canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('mouseenter', handleMouseEnter, { passive: true });
        canvas.addEventListener('mouseleave', handleMouseLeave, { passive: true });

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('mouseenter', handleMouseEnter);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ 
                    background: 'transparent',
                    willChange: 'transform' // GPU-Beschleunigung
                }}
            />
            {withOverlay && (
                <div className="absolute inset-0 bg-background/80 pointer-events-none" />
            )}
        </div>
    );
}