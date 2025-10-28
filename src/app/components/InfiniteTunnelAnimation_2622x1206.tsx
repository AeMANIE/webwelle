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

// Feste Zielgröße für das Display 2622 x 1206 (Höhe x Breite)
const TARGET_HEIGHT = 2622;
const TARGET_WIDTH = 1206;

export default function InfiniteTunnelAnimation_2622x1206() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasA = useRef<HTMLCanvasElement>(null);
    const canvasB = useRef<HTMLCanvasElement>(null);
    const ctxA = useRef<CanvasRenderingContext2D | null>(null);
    const ctxB = useRef<CanvasRenderingContext2D | null>(null);
    const animationRef = useRef<number | null>(null);
    
    const circles = useRef<Array<Circle>>([]);
    const origin = useRef({ x: TARGET_WIDTH * 0.5, y: TARGET_HEIGHT * 0.5 });
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

        // Feste Größe setzen (kein window-Resize, nur initial)
        const setFixedSize = () => {
            canvasAElement.width = TARGET_WIDTH;
            canvasAElement.height = TARGET_HEIGHT;
            canvasBElement.width = TARGET_WIDTH;
            canvasBElement.height = TARGET_HEIGHT;
        };

        const getCircle = (x: number, y: number, tickValue: number): Circle => {
            const circle: Circle = {
                position: { x, y },
                hue: -tickValue * 0.5,
                size: 2,
                ttl: 200,
                life: 0,
                destroy: false,
                
                update() {
                    this.life++;
                    this.destroy = this.life > this.ttl;
                    this.size *= 1.035;
                },
                
                draw(ctx: CanvasRenderingContext2D) {
                    this.update();
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = `hsla(${this.hue}, 100%, 50%, ${fadeInOut(this.life, this.ttl)})`;
                    ctx.arc(this.position.x, this.position.y, this.size, 0, TAU);
                    ctx.stroke();
                    ctx.closePath();
                }
            };
            return circle;
        };

        const draw = () => {
            tick.current++;
            
            const ctxAElement = ctxA.current;
            const ctxBElement = ctxB.current;
            if (!ctxAElement || !ctxBElement) return;

            // Performance: Nur alle 2 Frames zeichnen auf mobilen Geräten
            const isMobile = window.innerWidth < 768;
            if (isMobile && tick.current % 2 !== 0) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            // Clear canvases (feste Größe)
            ctxAElement.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
            ctxBElement.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
            
            // Update origin position
            if (isMouseActive.current) {
                const lerpFactor = 0.15;
                origin.current.x += (mouseX.current - origin.current.x) * lerpFactor;
                origin.current.y += (mouseY.current - origin.current.y) * lerpFactor;
            } else {
                // Tanzende Bewegung bei fester Größe
                const centerX = TARGET_WIDTH * 0.5;
                const centerY = TARGET_HEIGHT * 0.5;
                const danceRadiusX = TARGET_WIDTH * 0.25;
                const danceRadiusY = TARGET_HEIGHT * 0.125;
                
                origin.current.x = centerX + cos(tick.current * 0.025) * danceRadiusX;
                origin.current.y = centerY + sin(tick.current * 0.05) * danceRadiusY;
            }
            
            // Add new circle
            circles.current.push(getCircle(origin.current.x, origin.current.y, tick.current));
            
            // Draw and update circles
            for (let i = circles.current.length - 1; i >= 0; i--) {
                circles.current[i].draw(ctxAElement);
                if (circles.current[i].destroy) {
                    circles.current.splice(i, 1);
                }
            }
            
            // Post-Effekte
            ctxBElement.save();
            ctxBElement.filter = "blur(5px) saturate(200%) contrast(200%)";
            ctxBElement.drawImage(canvasAElement, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
            ctxBElement.restore();
            
            ctxBElement.save();
            ctxBElement.drawImage(canvasAElement, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
            ctxBElement.restore();
            
            animationRef.current = requestAnimationFrame(draw);
        };

        // Initialize
        setFixedSize();
        origin.current = { x: TARGET_WIDTH * 0.5, y: TARGET_HEIGHT * 0.5 };
        draw();

        // Events (innerhalb der festen Fläche) - Koordinaten auf Canvas-Größe skalieren
        const handleMouseMove = (e: MouseEvent) => {
            if (!isMouseActive.current) return; // Nur wenn aktiv geklickt
            const rect = (container as HTMLDivElement).getBoundingClientRect();
            const relativeX = (e.clientX - rect.left) / rect.width;
            const relativeY = (e.clientY - rect.top) / rect.height;
            mouseX.current = relativeX * TARGET_WIDTH;
            mouseY.current = relativeY * TARGET_HEIGHT;
        };

        const handleMouseLeave = () => {
            isMouseActive.current = false;
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (!isMouseActive.current) return; // Nur wenn aktiv getippt
            if (e.touches.length > 0) {
                const rect = (container as HTMLDivElement).getBoundingClientRect();
                const relativeX = (e.touches[0].clientX - rect.left) / rect.width;
                const relativeY = (e.touches[0].clientY - rect.top) / rect.height;
                mouseX.current = relativeX * TARGET_WIDTH;
                mouseY.current = relativeY * TARGET_HEIGHT;
            }
        };

        const handleTouchEnd = () => {
            isMouseActive.current = false;
        };

        // Click/Touch start handler
        const handleMouseDown = (e: MouseEvent) => {
            isMouseActive.current = true;
            handleMouseMove(e);
        };

        const handleMouseUp = () => {
            isMouseActive.current = false;
        };

        const handleTouchStart = (e: TouchEvent) => {
            isMouseActive.current = true;
            handleTouchMove(e);
        };

        container.addEventListener('mousedown', handleMouseDown);
        container.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            container.removeEventListener('mousedown', handleMouseDown);
            container.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    // Aspect Ratio berechnen
    const aspectRatio = TARGET_WIDTH / TARGET_HEIGHT; // 1206 / 2622 = 0.46

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full"
            style={{ 
                aspectRatio: `${aspectRatio}`,
                overflow: 'hidden'
            }}
        >
            <canvas
                ref={canvasB}
                className="absolute inset-0"
                style={{ width: '100%', height: '100%', background: 'transparent', pointerEvents: 'none' }}
            />
            <canvas
                ref={canvasA}
                className="absolute inset-0"
                style={{ width: '100%', height: '100%', background: 'transparent', pointerEvents: 'none' }}
            />
        </div>
    );
}


