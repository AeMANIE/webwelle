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

            // Mobile Detection
            const isMobile = width < 768;
            
            // WICHTIG: Für runde Canva immer quadratische Dimensionen verwenden
            // Dies verhindert, dass die Canva beim Scrollen oval wird
            const minDimension = Math.min(width, height);
            const maxDimension = Math.max(width, height);
            
            if (isMobile) {
                // Mobile: Im Portrait (vertikal) und Landscape (horizontal) groß bleiben
                // Im Landscape: Verwende die Breite (größer), im Portrait: Höhe (größer)
                // Verwende die größere Dimension für die Canva-Größe
                const canvasSize = Math.floor(maxDimension * 0.9); // 90% der größeren Dimension
                canvas.width = canvasSize;
                canvas.height = canvasSize;
                baseRadiusRef.current = canvasSize * 0.5;
            } else {
                // Desktop: Volle Breite/Höhe, Radius 30% größer und proportional zur Bildschirmgröße
                // WICHTIG: Bei größeren Bildschirmen soll die Canva größer werden, nicht kleiner!
                canvas.width = width;
                canvas.height = height;
                // Basis: 50% der kleineren Dimension, dann 30% größer = 65%
                // Bei großen Bildschirmen: Verwende auch die größere Dimension (40%), aber mindestens 65% der kleineren
                const baseRadius = minDimension * 0.65; // 30% größer als 0.5 = 0.65
                const largeScreenRadius = maxDimension * 0.4; // Für große Bildschirme
                // Verwende den größeren Wert, damit die Canva bei großen Bildschirmen größer wird
                baseRadiusRef.current = Math.max(baseRadius, largeScreenRadius);
            }
            
            centerXRef.current = canvas.width / 2;
            centerYRef.current = canvas.height / 2;
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

                // Berechne Länge basierend auf Position - unterschiedlich für Desktop und Mobile
                const isMobile = canvas.width < 768;
                let baseLengthFactor;
                if (isMobile) {
                    // Mobile: Längste Linien oben/unten (vertikal), kürzeste links/rechts (horizontal)
                    const verticalDistance = Math.abs(sin(angle));
                    baseLengthFactor = verticalDistance; // 1.0 oben/unten, 0.0 links/rechts
                } else {
                    // Desktop: Längste Linien links/rechts (horizontal), kürzeste oben/unten (vertikal)
                    const horizontalDistance = Math.abs(cos(angle));
                    baseLengthFactor = horizontalDistance; // 1.0 links/rechts, 0.0 oben/unten
                }

                // Audio-Visualizer-Effekt: Pulsierende Wellen - 20% langsamer
                const wave1 = sin(tick * 0.016 + index * 0.1 + line.phase) * 0.4; // 0.02 * 0.8 = 0.016
                const wave2 = sin(tick * 0.012 + index * 0.15) * 0.3; // 0.015 * 0.8 = 0.012
                const wave3 = sin(tick * 0.02 + index * 0.05) * 0.2; // 0.025 * 0.8 = 0.02

                // Kombiniere Basis-Länge mit Wellen-Effekt
                const dynamicLength = baseLengthFactor * (0.4 + wave1 + wave2 + wave3);
                // Linienlänge proportional zur Canvas-Größe - responsive für mobile
                const maxCanvasSize = Math.max(canvas.width, canvas.height);
                // Mobile: viel größere Linien (3x größer), Desktop: proportional zur Bildschirmgröße
                const lineLengthMultiplier = isMobile ? 0.3 : 0.12; // Mobile: 3x größer, Desktop: größer
                const lineLength = dynamicLength * maxCanvasSize * lineLengthMultiplier;

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

                // Farbiger Schatten - rotiert im Uhrzeigersinn - 20% langsamer
                const shadowHue = (tick * 0.4 - index * 2 + 360) % 360; // 0.5 * 0.8 = 0.4
                ctx.strokeStyle = `hsla(${shadowHue}, 100%, 50%, 0.2)`;
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Zeichne Hauptlinie
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);

                // Farbige Linien - rotiert im Uhrzeigersinn - 20% langsamer
                const intensity = Math.max(0.3, Math.min(1, dynamicLength));
                // Hue rotiert im Uhrzeigersinn durch das Spektrum
                const hue = (tick * 0.4 - index * 2 + 360) % 360; // 0.5 * 0.8 = 0.4
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
        <div ref={containerRef} className="absolute inset-0 w-full h-full flex items-center justify-center">
            <canvas
                ref={canvasRef}
                className="absolute"
                style={{ 
                    background: 'transparent', 
                    pointerEvents: 'none',
                    // WICHTIG: Aspect-ratio 1:1 für runde Form, auch beim Scrollen auf Mobile
                    aspectRatio: '1 / 1',
                    // Mobile: quadratisch und zentriert, Desktop: volle Größe
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                }}
            />
        </div>
    );
}

