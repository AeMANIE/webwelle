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

// Circle Pool für bessere Performance
class CirclePool {
    private pool: Circle[] = [];
    
    getCircle(x: number, y: number, tickValue: number): Circle {
        let circle = this.pool.pop();
        if (!circle) {
            circle = this.createCircle();
        }
        
        // Reset properties
        circle.position.x = x;
        circle.position.y = y;
        circle.hue = -tickValue * 0.5;
        circle.size = 2;
        circle.ttl = 200;
        circle.life = 0;
        circle.destroy = false;
        
        return circle;
    }
    
    releaseCircle(circle: Circle) {
        this.pool.push(circle);
    }
    
    private createCircle(): Circle {
        return {
            position: { x: 0, y: 0 },
            hue: 0,
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
    }
}

// Canvas Buffer für bessere Performance
class CanvasBuffer {
    private buffer: HTMLCanvasElement;
    private bufferCtx: CanvasRenderingContext2D;
    
    constructor(width: number, height: number) {
        this.buffer = document.createElement('canvas');
        this.buffer.width = width;
        this.buffer.height = height;
        this.bufferCtx = this.buffer.getContext('2d')!;
    }
    
    drawToBuffer(callback: (ctx: CanvasRenderingContext2D) => void) {
        callback(this.bufferCtx);
    }
    
    drawFromBuffer(targetCtx: CanvasRenderingContext2D) {
        targetCtx.drawImage(this.buffer, 0, 0);
    }
    
    clear() {
        this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
    }
    
    resize(width: number, height: number) {
        this.buffer.width = width;
        this.buffer.height = height;
    }
}

export default function InfiniteTunnelAnimation() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasA = useRef<HTMLCanvasElement>(null);
    const canvasB = useRef<HTMLCanvasElement>(null);
    const ctxA = useRef<CanvasRenderingContext2D | null>(null);
    const ctxB = useRef<CanvasRenderingContext2D | null>(null);
    const animationRef = useRef<number | null>(null);
    
    // Caching Refs
    const circles = useRef<Array<Circle>>([]);
    const circlePool = useRef<CirclePool | null>(null);
    const canvasBuffer = useRef<CanvasBuffer | null>(null);
    const origin = useRef({ x: 0, y: 0 });
    const tick = useRef(0);
    const mouseX = useRef(0);
    const mouseY = useRef(0);
    const isMouseActive = useRef(false);
    
    // Performance Caching
    const performanceLevel = useRef<'low' | 'medium' | 'high'>('high');
    const frameSkip = useRef(0);
    const isVisible = useRef(true);
    const frameSkipCounter = useRef(0);
    
    // Event Handler Cache
    const eventHandlers = useRef<{
        mouseMove?: (e: MouseEvent) => void;
        mouseLeave?: () => void;
        touchMove?: (e: TouchEvent) => void;
        touchEnd?: () => void;
        resize?: () => void;
    }>({});

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const canvasAElement = canvasA.current;
        const canvasBElement = canvasB.current;
        if (!canvasAElement || !canvasBElement) return;

        // Cache Context
        if (!ctxA.current) {
            ctxA.current = canvasAElement.getContext('2d');
        }
        if (!ctxB.current) {
            ctxB.current = canvasBElement.getContext('2d');
        }
        
        if (!ctxA.current || !ctxB.current) return;

        // Initialize Performance Level Cache
        const isMobile = window.innerWidth < 768;
        const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        performanceLevel.current = isMobile ? (isLowEnd ? 'low' : 'medium') : 'high';
        frameSkip.current = performanceLevel.current === 'low' ? 2 : performanceLevel.current === 'medium' ? 1 : 0;

        // Initialize Circle Pool
        if (!circlePool.current) {
            circlePool.current = new CirclePool();
        }

        // Initialize Canvas Buffer
        if (!canvasBuffer.current) {
            canvasBuffer.current = new CanvasBuffer(window.innerWidth, window.innerHeight);
        }

        const resize = () => {
            canvasAElement.width = window.innerWidth;
            canvasAElement.height = window.innerHeight;
            canvasBElement.width = window.innerWidth;
            canvasBElement.height = window.innerHeight;
            
            if (canvasBuffer.current) {
                canvasBuffer.current.resize(window.innerWidth, window.innerHeight);
            }
        };

        const draw = () => {
            tick.current++;
            
            // Visibility-based frame skipping
            if (!isVisible.current) {
                frameSkipCounter.current++;
                if (frameSkipCounter.current < 10) {
                    animationRef.current = requestAnimationFrame(draw);
                    return;
                }
            }
            frameSkipCounter.current = 0;
            
            // Performance-based frame skipping
            if (frameSkip.current > 0 && tick.current % (frameSkip.current + 1) !== 0) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }
            
            const ctxAElement = ctxA.current;
            const ctxBElement = ctxB.current;
            if (!ctxAElement || !ctxBElement) return;

            // Clear canvases
            ctxAElement.clearRect(0, 0, canvasAElement.width, canvasAElement.height);
            ctxBElement.clearRect(0, 0, canvasBElement.width, canvasBElement.height);
            
            // Update origin position
            if (isMouseActive.current) {
                // Follow mouse
                const lerpFactor = 0.15;
                origin.current.x += (mouseX.current - origin.current.x) * lerpFactor;
                origin.current.y += (mouseY.current - origin.current.y) * lerpFactor;
            } else {
                // ALWAYS dance
                const centerX = window.innerWidth * 0.5;
                const centerY = window.innerHeight * 0.5;
                const danceRadiusX = window.innerWidth * 0.25;
                const danceRadiusY = window.innerHeight * 0.125;
                
                origin.current.x = centerX + cos(tick.current * 0.025) * danceRadiusX;
                origin.current.y = centerY + sin(tick.current * 0.05) * danceRadiusY;
            }
            
            // Add new circle using pool
            if (circlePool.current) {
                circles.current.push(circlePool.current.getCircle(origin.current.x, origin.current.y, tick.current));
            }
            
            // Draw and update circles
            for (let i = circles.current.length - 1; i >= 0; i--) {
                circles.current[i].draw(ctxAElement);
                if (circles.current[i].destroy) {
                    // Return circle to pool
                    if (circlePool.current) {
                        circlePool.current.releaseCircle(circles.current[i]);
                    }
                    circles.current.splice(i, 1);
                }
            }
            
            // Apply blur and color effects
            ctxBElement.save();
            ctxBElement.filter = "blur(5px) saturate(200%) contrast(200%)";
            ctxBElement.drawImage(canvasAElement, 0, 0, canvasBElement.width, canvasBElement.height);
            ctxBElement.restore();
            
            // Draw original image on top
            ctxBElement.save();
            ctxBElement.drawImage(canvasAElement, 0, 0, canvasBElement.width, canvasBElement.height);
            ctxBElement.restore();
            
            animationRef.current = requestAnimationFrame(draw);
        };

        // Cache Event Handlers
        if (!eventHandlers.current.mouseMove) {
            eventHandlers.current.mouseMove = (e: MouseEvent) => {
                mouseX.current = e.clientX;
                mouseY.current = e.clientY;
                isMouseActive.current = true;
            };
        }
        
        if (!eventHandlers.current.mouseLeave) {
            eventHandlers.current.mouseLeave = () => {
                isMouseActive.current = false;
            };
        }
        
        if (!eventHandlers.current.touchMove) {
            eventHandlers.current.touchMove = (e: TouchEvent) => {
                e.preventDefault();
                if (e.touches.length > 0) {
                    mouseX.current = e.touches[0].clientX;
                    mouseY.current = e.touches[0].clientY;
                    isMouseActive.current = true;
                }
            };
        }
        
        if (!eventHandlers.current.touchEnd) {
            eventHandlers.current.touchEnd = () => {
                isMouseActive.current = false;
            };
        }
        
        if (!eventHandlers.current.resize) {
            eventHandlers.current.resize = resize;
        }

        // Initialize
        origin.current = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
        resize();
        draw();

        // Add event listeners
        container.addEventListener('mousemove', eventHandlers.current.mouseMove);
        container.addEventListener('mouseleave', eventHandlers.current.mouseLeave);
        container.addEventListener('touchmove', eventHandlers.current.touchMove, { passive: false });
        container.addEventListener('touchend', eventHandlers.current.touchEnd);
        window.addEventListener('resize', eventHandlers.current.resize);

        // Intersection Observer für Visibility Caching
        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible.current = entry.isIntersecting;
            },
            { threshold: 0.1 }
        );
        
        observer.observe(container);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            
            // Cleanup event listeners
            if (eventHandlers.current.mouseMove) {
                container.removeEventListener('mousemove', eventHandlers.current.mouseMove);
            }
            if (eventHandlers.current.mouseLeave) {
                container.removeEventListener('mouseleave', eventHandlers.current.mouseLeave);
            }
            if (eventHandlers.current.touchMove) {
                container.removeEventListener('touchmove', eventHandlers.current.touchMove);
            }
            if (eventHandlers.current.touchEnd) {
                container.removeEventListener('touchend', eventHandlers.current.touchEnd);
            }
            if (eventHandlers.current.resize) {
                window.removeEventListener('resize', eventHandlers.current.resize);
            }
            
            observer.disconnect();
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