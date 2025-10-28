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

        // Mobile Performance Optimierung
        const isMobile = window.innerWidth < 768;
        const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        const performanceLevel = isMobile || isLowEndDevice ? 'low' : 'high';

        const resize = () => {
            canvasAElement.width = window.innerWidth;
            canvasAElement.height = window.innerHeight;
            canvasBElement.width = window.innerWidth;
            canvasBElement.height = window.innerHeight;
        };

        const getCircle = (x: number, y: number, tickValue: number): Circle => {
            const circle: Circle = {
                position: { x, y },
                hue: -tickValue * (performanceLevel === 'low' ? 0.3 : 0.5),
                size: performanceLevel === 'low' ? 1.5 : 2,
                ttl: performanceLevel === 'low' ? 150 : 200,
                life: 0,
                destroy: false,
                
                update() {
                    this.life++;
                    this.destroy = this.life > this.ttl;
                    this.size *= performanceLevel === 'low' ? 1.025 : 1.035;
                },
                
                draw(ctx: CanvasRenderingContext2D) {
                    this.update();
                    ctx.beginPath();
                    ctx.lineWidth = performanceLevel === 'low' ? 1.5 : 2;
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

            // Clear canvases
            ctxAElement.clearRect(0, 0, canvasAElement.width, canvasAElement.height);
            ctxBElement.clearRect(0, 0, canvasBElement.width, canvasBElement.height);
            
            // Update origin position
            if (isMouseActive.current) {
                // Follow mouse
                const lerpFactor = performanceLevel === 'low' ? 0.1 : 0.15;
                origin.current.x += (mouseX.current - origin.current.x) * lerpFactor;
                origin.current.y += (mouseY.current - origin.current.y) * lerpFactor;
            } else {
                // ALWAYS dance - reduziert auf Mobile
                const centerX = window.innerWidth * 0.5;
                const centerY = window.innerHeight * 0.5;
                const danceRadiusX = window.innerWidth * (performanceLevel === 'low' ? 0.2 : 0.25);
                const danceRadiusY = window.innerHeight * (performanceLevel === 'low' ? 0.1 : 0.125);
                
                const danceSpeed = performanceLevel === 'low' ? 0.015 : 0.025;
                origin.current.x = centerX + cos(tick.current * danceSpeed) * danceRadiusX;
                origin.current.y = centerY + sin(tick.current * (danceSpeed * 2)) * danceRadiusY;
            }
            
            // Add new circle - reduziert auf Mobile
            if (tick.current % (performanceLevel === 'low' ? 3 : 2) === 0) {
                circles.current.push(getCircle(origin.current.x, origin.current.y, tick.current));
            }
            
            // Mobile: Begrenzte Anzahl von Kreisen
            const maxCircles = performanceLevel === 'low' ? 50 : 100;
            if (circles.current.length > maxCircles) {
                circles.current = circles.current.slice(-maxCircles);
            }
            
            // Draw and update circles
            for (let i = circles.current.length - 1; i >= 0; i--) {
                circles.current[i].draw(ctxAElement);
                if (circles.current[i].destroy) {
                    circles.current.splice(i, 1);
                }
            }
            
            // Apply blur and color effects - reduziert auf Mobile
            if (performanceLevel === 'high') {
                ctxBElement.save();
                ctxBElement.filter = "blur(5px) saturate(200%) contrast(200%)";
                ctxBElement.drawImage(canvasAElement, 0, 0, canvasBElement.width, canvasBElement.height);
                ctxBElement.restore();
                
                // Draw original image on top
                ctxBElement.save();
                ctxBElement.drawImage(canvasAElement, 0, 0, canvasBElement.width, canvasBElement.height);
                ctxBElement.restore();
            } else {
                // Mobile: Einfacherer Effekt
                ctxBElement.save();
                ctxBElement.filter = "blur(3px) saturate(150%)";
                ctxBElement.drawImage(canvasAElement, 0, 0, canvasBElement.width, canvasBElement.height);
                ctxBElement.restore();
            }
            
            // Mobile: Reduzierte Framerate
            const targetFPS = performanceLevel === 'low' ? 30 : 60;
            const frameDelay = 1000 / targetFPS;
            
            setTimeout(() => {
                animationRef.current = requestAnimationFrame(draw);
            }, frameDelay);
        };

        // Event handlers
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.current = e.clientX;
            mouseY.current = e.clientY;
            isMouseActive.current = true;
        };

        const handleMouseLeave = () => {
            isMouseActive.current = false;
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                mouseX.current = e.touches[0].clientX;
                mouseY.current = e.touches[0].clientY;
                isMouseActive.current = true;
            }
        };

        const handleTouchEnd = () => {
            isMouseActive.current = false;
        };

        // Initialize
        origin.current = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
        resize();
        draw();

        // Add event listeners
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('resize', resize);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full">
            <canvas
                ref={canvasB}
                className="absolute inset-0 w-full h-full"
                style={{ background: 'transparent', pointerEvents: 'none' }}
            />
            <canvas
                ref={canvasA}
                className="absolute inset-0 w-full h-full"
                style={{ background: 'transparent', pointerEvents: 'none' }}
            />
        </div>
    );
}

