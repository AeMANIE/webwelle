'use client';

import { useEffect, useRef } from 'react';

const { PI, cos, sin, abs } = Math;

const HALF_PI = 0.5 * PI;
const TAU = 2 * PI;

const fadeInOut = (t: number, m: number) => {
    const hm = 0.5 * m;
    return abs((t + hm) % m - hm) / hm;
};

export default function CanvaAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const circles: Array<{
            position: { x: number; y: number };
            hue: number;
            size: number;
            ttl: number;
            life: number;
            destroy: boolean;
            update: () => void;
            draw: () => void;
        }> = [];
        let origin = { x: 0, y: 0 };
        let targetOrigin = { x: 0, y: 0 };
        let tick = 0;
        let mouseX = 0;
        let mouseY = 0;
        let isMouseActive = false;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const getCircle = (x: number, y: number, tick: number) => {
            return {
                position: { x, y },
                hue: -tick * 0.5,
                size: 2,
                ttl: 200,
                life: 0,
                destroy: false,
                
                update() {
                    this.life++;
                    this.destroy = this.life > this.ttl;
                    this.size *= 1.035;
                },
                
                draw() {
                    this.update();
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = `hsla(${this.hue}, 100%, 50%, ${fadeInOut(this.life, this.ttl)})`;
                    ctx.arc(this.position.x, this.position.y, this.size, 0, TAU);
                    ctx.stroke();
                    ctx.closePath();
                }
            };
        };

        const draw = () => {
            tick++;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update origin position - follow mouse or use automatic movement
            if (isMouseActive) {
                // Smooth interpolation to mouse position
                const lerpFactor = 0.1;
                origin.x += (targetOrigin.x - origin.x) * lerpFactor;
                origin.y += (targetOrigin.y - origin.y) * lerpFactor;
            } else {
                // Automatic movement when mouse is not active
                origin.x = window.innerWidth * 0.5 + cos(tick * 0.025) * window.innerWidth * 0.25;
                origin.y = window.innerHeight * 0.5 + sin(tick * 0.05) * window.innerHeight * 0.125;
            }
            
            // Add new circle
            circles.push(getCircle(origin.x, origin.y, tick));
            
            // Draw and update circles
            for (let i = circles.length - 1; i >= 0; i--) {
                circles[i].draw();
                if (circles[i].destroy) {
                    circles.splice(i, 1);
                }
            }
            
            animationRef.current = requestAnimationFrame(draw);
        };

        // Mouse event handlers
        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            targetOrigin.x = mouseX;
            targetOrigin.y = mouseY;
            isMouseActive = true;
        };

        const handleMouseLeave = () => {
            isMouseActive = false;
            // Return to center when mouse leaves
            targetOrigin.x = window.innerWidth * 0.5;
            targetOrigin.y = window.innerHeight * 0.5;
        };

        const handleMouseEnter = () => {
            isMouseActive = true;
        };

        // Initialize
        origin = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
        targetOrigin = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
        resize();
        draw();

        // Event listeners
        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("mouseenter", handleMouseEnter);

        // Cleanup
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("mouseenter", handleMouseEnter);
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
