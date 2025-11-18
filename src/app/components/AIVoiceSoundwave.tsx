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
            // Ring-Radius - 35% größer (0.2 * 1.35 = 0.27)
            baseRadiusRef.current = Math.min(canvas.width, canvas.height) * 0.27;
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

            // Zeichne weißen Kreis in der Mitte (wie im ursprünglichen Bild)
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius, 0, PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();

            // Zeichne alle Linien (vertikale Balken radial nach außen)
            linesRef.current.forEach((line, index) => {
                const angle = line.angle;

                // Berechne Position auf dem Ring (am Rand des weißen Kreises)
                const radius = baseRadius;
                const startX = centerX + cos(angle) * radius;
                const startY = centerY + sin(angle) * radius;

                // Berechne Länge basierend auf Position
                // Längste Linien oben/unten (vertikal), kürzeste links/rechts (horizontal)
                const verticalDistance = Math.abs(sin(angle));
                const baseLengthFactor = verticalDistance; // 1.0 oben/unten, 0.0 links/rechts

                // Ruhige Voice-AI Soundwave: Langsame, sanfte Wellen
                const wave1 = sin(tick * 0.005 + index * 0.05 + line.phase) * 0.15;
                const wave2 = sin(tick * 0.003 + index * 0.08) * 0.12;
                const wave3 = sin(tick * 0.007 + index * 0.03) * 0.08;

                // Kombiniere Basis-Länge mit sanften Wellen-Effekt
                const dynamicLength = baseLengthFactor * (0.6 + wave1 + wave2 + wave3);
                // Linienlänge proportional zur Canvas-Größe - 35% größer (0.15 * 1.35 = 0.2025)
                const maxCanvasSize = Math.max(canvas.width, canvas.height);
                const lineLength = dynamicLength * maxCanvasSize * 0.2;

                // Mindestlänge für sichtbare Linien
                if (lineLength < 2) return;

                // Berechne Endpunkt (radial nach außen)
                const endX = startX + cos(angle) * lineLength;
                const endY = startY + sin(angle) * lineLength;

                // Linienbreite - dünn wie im ursprünglichen Bild
                const lineWidth = Math.max(1, Math.min(2, lineLength * 0.01));

                // Zeichne Schatten (leicht versetzt nach rechts/unten) - farbig
                ctx.beginPath();
                ctx.moveTo(startX + 1, startY + 1);
                ctx.lineTo(endX + 1, endY + 1);

                // Farbiger Schatten - kontinuierlicher Farbverlauf durch das Spektrum
                // Hue basierend auf Winkel (Position im Kreis) für kontinuierlichen Verlauf
                const shadowHue = (index / numLines) * 360;
                ctx.strokeStyle = `hsla(${shadowHue}, 100%, 50%, 0.2)`;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Zeichne Hauptlinie
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);

                // Farbige Linien - kontinuierlicher Farbverlauf durch das Spektrum
                // Hue basierend auf Position im Kreis (nicht auf Zeit) für statischen Verlauf
                const hue = (index / numLines) * 360;
                const intensity = Math.max(0.4, Math.min(1, dynamicLength));
                const saturation = 100;
                const lightness = 50;
                const alpha = 0.7 + intensity * 0.3;

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

