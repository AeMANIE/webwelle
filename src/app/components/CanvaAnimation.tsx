'use client';

import { useEffect, useRef } from 'react';

const { PI, sin, cos, random } = Math;

export default function CanvaAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const tickRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let gridWidth = 0;
        let gridHeight = 0;
        let cellSize = 20; // Abstand zwischen Punkten
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
                
                // Intensität basierend auf Wellen
                let intensity = 0.3 + wave1 + wave2 + wave3 + wave4;
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

        draw();

        window.addEventListener('resize', resize);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ background: 'black' }}
        />
    );
}
