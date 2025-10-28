'use client';

import { useEffect, useRef } from 'react';

const { PI, cos, sin, abs } = Math;

const TAU = 2 * PI;

const fadeInOut = (t: number, m: number) => {
    const hm = 0.5 * m;
    return abs((t + hm) % m - hm) / hm;
};

interface Circle {
    position: { x: number; y: number };
    hue: number;
    size: number;
    ttl: number;
    life: number;
    destroy: boolean;
    update(): void;
    draw(ctx: CanvasRenderingContext2D): void;
}

export default function InfiniteTunnelAnimation() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasA = useRef<HTMLCanvasElement>(null);
    const canvasB = useRef<HTMLCanvasElement>(null);
    const ctxA = useRef<CanvasRenderingContext2D | null>(null);
    const ctxB = useRef<CanvasRenderingContext2D | null>(null);
    const animationRef = useRef<number | null>(null);
    
    const circles = useRef<Array<Circle>>([]);
    const origin = useRef({ x: 0, y: 0 });
    const tick = useRef(0);
    const mouseX = useRef(0);
    const mouseY = useRef(0);
    const isMouseActive = useRef(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const canvasAElement = canvasA.current;
        const canvasBElement = canvasB.current;
        if (!canvasAElement || !canvasBElement) return;

        ctxA.current = canvasAElement.getContext('2d');
        ctxB.current = canvasBElement.getContext('2d');
        
        if (!ctxA.current || !ctxB.current) return;

        // Mobile Detection mit Performance-Optimierung
        const isMobile = window.innerWidth < 768;
        const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        
        // Performance-Level basierend auf Gerät
        const performanceLevel = isMobile ? (isLowEndDevice ? 'low' : 'medium') : 'high';
        const frameSkip = performanceLevel === 'low' ? 2 : performanceLevel === 'medium' ? 1 : 0;
        const maxCircles = performanceLevel === 'low' ? 15 : performanceLevel === 'medium' ? 25 : 40;

        const resize = () => {
            requestAnimationFrame(() => {
                const rect = container.getBoundingClientRect();
                canvasAElement.width = rect.width;
                canvasAElement.height = rect.height;
                canvasBElement.width = rect.width;
                canvasBElement.height = rect.height;
                
                origin.current = {
                    x: rect.width * 0.5,
                    y: rect.height * 0.5
                };
            });
        };

        resize();

        const createCircle = (): Circle => {
            const hue = 210; // Dunkelblau-Grau
            const size = performanceLevel === 'low' ? 2 : performanceLevel === 'medium' ? 3 : 4;
            const ttl = performanceLevel === 'low' ? 60 : performanceLevel === 'medium' ? 80 : 100;
            
            return {
                position: { x: origin.current.x, y: origin.current.y },
                hue,
                size,
                ttl,
                life: 0,
                destroy: false,
                update() {
                    this.life++;
                    
                    if (this.life >= this.ttl) {
                        this.destroy = true;
                        return;
                    }
                    
                    const progress = this.life / this.ttl;
                    const lerpFactor = performanceLevel === 'low' ? 0.05 : performanceLevel === 'medium' ? 0.08 : 0.1;
                    
                    // Reduzierte Berechnungen für bessere Performance
                    const danceRadiusX = performanceLevel === 'low' ? 20 : performanceLevel === 'medium' ? 30 : 40;
                    const danceRadiusY = performanceLevel === 'low' ? 15 : performanceLevel === 'medium' ? 25 : 35;
                    const danceSpeed = performanceLevel === 'low' ? 0.02 : performanceLevel === 'medium' ? 0.03 : 0.04;
                    
                    const targetX = isMouseActive.current ? 
                        mouseX.current : 
                        origin.current.x + cos(tick.current * danceSpeed) * danceRadiusX;
                    const targetY = isMouseActive.current ? 
                        mouseY.current : 
                        origin.current.y + sin(tick.current * danceSpeed) * danceRadiusY;
                    
                    this.position.x += (targetX - this.position.x) * lerpFactor;
                    this.position.y += (targetY - this.position.y) * lerpFactor;
                },
                draw(ctx) {
                    const progress = this.life / this.ttl;
                    const alpha = fadeInOut(progress, 1) * 0.7;
                    
                    ctx.strokeStyle = `hsla(${this.hue}, 20%, 22%, ${alpha})`;
                    ctx.lineWidth = this.size;
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, this.size * 2, 0, TAU);
                    ctx.stroke();
                }
            };
        };

        const draw = () => {
            tick.current++;
            
            // Frame-Skipping für bessere Performance auf mobilen Geräten
            if (frameSkip > 0 && tick.current % (frameSkip + 1) !== 0) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            if (!ctxA.current || !ctxB.current) return;

            // Clear canvases
            ctxA.current.clearRect(0, 0, canvasAElement.width, canvasAElement.height);
            ctxB.current.clearRect(0, 0, canvasBElement.width, canvasBElement.height);

            // Update and draw circles
            circles.current.forEach(circle => {
                circle.update();
                if (!circle.destroy) {
                    circle.draw(ctxA.current!);
                }
            });

            // Remove destroyed circles
            circles.current = circles.current.filter(circle => !circle.destroy);

            // Add new circles
            if (tick.current % (performanceLevel === 'low' ? 8 : performanceLevel === 'medium' ? 6 : 4) === 0 && 
                circles.current.length < maxCircles) {
                circles.current.push(createCircle());
            }

            // Apply blur effect to canvas B
            ctxB.current.filter = performanceLevel === 'low' ? 
                "blur(2px) saturate(110%) contrast(140%)" : 
                performanceLevel === 'medium' ? 
                "blur(3px) saturate(120%) contrast(150%)" : 
                "blur(3px) saturate(120%) contrast(150%)";
            ctxB.current.drawImage(canvasAElement, 0, 0);
            ctxB.current.filter = 'none';

            animationRef.current = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvasAElement.getBoundingClientRect();
            mouseX.current = e.clientX - rect.left;
            mouseY.current = e.clientY - rect.top;
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const rect = canvasAElement.getBoundingClientRect();
            const touch = e.touches[0];
            mouseX.current = touch.clientX - rect.left;
            mouseY.current = touch.clientY - rect.top;
        };

        const handleMouseDown = () => {
            isMouseActive.current = true;
        };

        const handleMouseUp = () => {
            isMouseActive.current = false;
        };

        const handleMouseLeave = () => {
            isMouseActive.current = false;
        };

        // Event Listeners mit Passiv-Option für bessere Performance
        window.addEventListener('resize', resize, { passive: true });
        canvasAElement.addEventListener('mousemove', handleMouseMove, { passive: true });
        canvasAElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvasAElement.addEventListener('mousedown', handleMouseDown, { passive: true });
        canvasAElement.addEventListener('mouseup', handleMouseUp, { passive: true });
        canvasAElement.addEventListener('mouseleave', handleMouseLeave, { passive: true });

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            window.removeEventListener('resize', resize);
            canvasAElement.removeEventListener('mousemove', handleMouseMove);
            canvasAElement.removeEventListener('touchmove', handleTouchMove);
            canvasAElement.removeEventListener('mousedown', handleMouseDown);
            canvasAElement.removeEventListener('mouseup', handleMouseUp);
            canvasAElement.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-full">
            <canvas
                ref={canvasA}
                className="absolute inset-0 w-full h-full"
                style={{ 
                    background: 'transparent',
                    willChange: 'transform' // GPU-Beschleunigung
                }}
            />
            <canvas
                ref={canvasB}
                className="absolute inset-0 w-full h-full"
                style={{ 
                    background: 'transparent',
                    willChange: 'transform' // GPU-Beschleunigung
                }}
            />
        </div>
    );
}