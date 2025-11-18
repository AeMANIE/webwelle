'use client';

import { useEffect, useRef } from 'react';

const { PI, sin, cos, random } = Math;

interface Line {
    angle: number;
    phase: number;
    baseLength: number;
}

export default function AIVoiceSoundwave() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const tickRef = useRef(0);
    const linesRef = useRef<Line[]>([]);
    const centerXRef = useRef(0);
    const centerYRef = useRef(0);
    const baseRadiusRef = useRef(150);
    const numLines = 360; // Weniger Linien für ruhigeren, klareren Effekt

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            if (!canvas) return;
            
            // Verwende window.innerWidth/Height direkt wie InfiniteTunnelAnimation
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            if (width <= 0 || height <= 0) return;

            canvas.width = width;
            canvas.height = height;
            centerXRef.current = canvas.width / 2;
            centerYRef.current = canvas.height / 2;
            // Ring-Radius - DEUTLICH größer für sichtbaren Unterschied
            baseRadiusRef.current = Math.min(canvas.width, canvas.height) * 0.4;
            createLines();
        };

        const createLines = () => {
            linesRef.current = [];
            for (let i = 0; i < numLines; i++) {
                const angle = (i / numLines) * PI * 2;
                linesRef.current.push({
                    angle: angle,
                    phase: random() * PI * 2,
                    baseLength: 0
                });
            }
        };

        const animate = () => {
            tickRef.current++;
            const tick = tickRef.current;
            const centerX = centerXRef.current;
            const centerY = centerYRef.current;
            const baseRadius = baseRadiusRef.current;

            // Clear canvas - transparent
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Zeichne alle Linien (vertikale Balken radial nach außen) - OHNE weißen Kreis
            linesRef.current.forEach((line, index) => {
                const angle = line.angle;

                // Berechne Position - starte vom Zentrum (kein weißer Kreis)
                const radius = baseRadius;
                const startX = centerX + cos(angle) * radius;
                const startY = centerY + sin(angle) * radius;

                // Berechne Länge basierend auf Position (wie im ursprünglichen Bild)
                // Längste Linien oben/unten (vertikal), kürzeste links/rechts (horizontal)
                const verticalDistance = Math.abs(sin(angle));
                const baseLengthFactor = verticalDistance; // 1.0 oben/unten, 0.0 links/rechts

                // Audio-Visualizer-Effekt: Pulsierende Wellen (wie im Original)
                const wave1 = sin(tick * 0.02 + index * 0.1 + line.phase) * 0.4;
                const wave2 = sin(tick * 0.015 + index * 0.15) * 0.3;
                const wave3 = sin(tick * 0.025 + index * 0.05) * 0.2;

                // Kombiniere Basis-Länge mit Wellen-Effekt (wie im Original)
                const dynamicLength = baseLengthFactor * (0.4 + wave1 + wave2 + wave3);
                // Linienlänge proportional zur Canvas-Größe
                const maxCanvasSize = Math.max(canvas.width, canvas.height);
                const lineLength = dynamicLength * maxCanvasSize * 0.2;

                // Mindestlänge für sichtbare Linien
                if (lineLength < 3) return;

                // Berechne Endpunkt (radial nach außen)
                const endX = startX + cos(angle) * lineLength;
                const endY = startY + sin(angle) * lineLength;

                // Linienbreite variiert mit Länge (wie im Original)
                const lineWidth = Math.max(1, Math.min(3, lineLength * 0.02));

                // Zeichne Schatten (leicht versetzt nach rechts/unten) - farbig
                ctx.beginPath();
                ctx.moveTo(startX + 1, startY + 1);
                ctx.lineTo(endX + 1, endY + 1);

                // Farbiger Schatten - rotiert im Uhrzeigersinn
                const shadowHue = (tick * 0.5 - index * 2 + 360) % 360;
                ctx.strokeStyle = `hsla(${shadowHue}, 100%, 50%, 0.2)`;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Zeichne Hauptlinie
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);

                // Farbige Linien - rotiert im Uhrzeigersinn
                const intensity = Math.max(0.3, Math.min(1, dynamicLength));
                // Hue rotiert im Uhrzeigersinn durch das Spektrum
                const hue = (tick * 0.5 - index * 2 + 360) % 360;
                // Saturation und Lightness für lebendige Farben
                const saturation = 100;
                const lightness = 50;
                const alpha = 0.6 + intensity * 0.4;

                ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.stroke();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        // Initial setup - direkt wie InfiniteTunnelAnimation
        centerXRef.current = window.innerWidth * 0.5;
        centerYRef.current = window.innerHeight * 0.5;
        resize();
        createLines();
        animate();

        // Handle resize
        const handleResize = () => {
            resize();
        };

        window.addEventListener('resize', handleResize);
        
        // Cleanup
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ 
                    background: 'transparent', 
                    pointerEvents: 'none'
                }}
            />
        </div>
    );
}

