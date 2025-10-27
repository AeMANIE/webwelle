'use client';

import { useEffect, useRef } from 'react';

const { PI, sin, cos, abs, random, sqrt } = Math;
const TAU = 2 * PI;

export default function CanvaAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const tickRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let centerX = 0;
        let centerY = 0;
        const mouseX = 0;
        const mouseY = 0;
        const explosions: any[] = [];
        const particles: any[] = [];

        // Explosion Class - für spektakuläre Effekte
        class Explosion {
            x: number;
            y: number;
            particles: any[];
            life: number;
            maxLife: number;
            
            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.life = 0;
                this.maxLife = 60;
                this.particles = [];
                
                // Erstelle weniger Partikel für bessere Performance
                for (let i = 0; i < 30; i++) {
                    const angle = (i / 30) * TAU;
                    const speed = random() * 5 + 2;
                    this.particles.push({
                        x: 0,
                        y: 0,
                        vx: cos(angle) * speed,
                        vy: sin(angle) * speed,
                        size: random() * 4 + 2,
                        life: random() * 60 + 30,
                        hue: 260 + random() * 60
                    });
                }
            }
            
            update() {
                this.life++;
                this.particles.forEach(p => {
                    p.x += p.vx * 0.8;
                    p.y += p.vy * 0.8;
                    p.vx *= 0.95;
                    p.vy *= 0.95;
                    p.life--;
                });
            }
            
            draw(ctx: CanvasRenderingContext2D) {
                const alpha = 1 - (this.life / this.maxLife);
                
                this.particles.forEach(p => {
                    const pAlpha = (p.life / 60) * alpha;
                    ctx.globalAlpha = pAlpha;
                    
                    // Starburst effekt
                    ctx.beginPath();
                    ctx.arc(p.x + this.x, p.y + this.y, p.size, 0, TAU);
                    ctx.fillStyle = `hsl(${p.hue}, 100%, 60%)`;
                    ctx.fill();
                    
                    // Glow
                    ctx.beginPath();
                    ctx.arc(p.x + this.x, p.y + this.y, p.size * 2, 0, TAU);
                    ctx.fillStyle = `hsl(${p.hue}, 100%, 70%)`;
                    ctx.fill();
                });
                
                ctx.globalAlpha = 1;
            }
            
            isDead() {
                return this.life >= this.maxLife;
            }
        }

        // Particle Class für kontinuierliche Effekte
        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            hue: number;
            alpha: number;
            type: 'spark' | 'energy' | 'glow';
            
            constructor(canvas: HTMLCanvasElement) {
                this.x = random() * canvas.width;
                this.y = random() * canvas.height;
                this.vx = (random() - 0.5) * 0.5;
                this.vy = (random() - 0.5) * 0.5;
                this.size = random() * 3 + 1;
                this.hue = 260 + random() * 60;
                this.alpha = random() * 0.5 + 0.3;
                this.type = ['spark', 'energy', 'glow'][Math.floor(random() * 3)] as any;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                
                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
                
                // Alpha pulsation
                this.alpha = abs(sin(tickRef.current * 0.05 + this.x * 0.01)) * 0.5 + 0.3;
            }
            
            draw(ctx: CanvasRenderingContext2D) {
                ctx.globalAlpha = this.alpha;
                
                if (this.type === 'spark') {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, TAU);
                    ctx.fillStyle = `hsl(${this.hue}, 100%, 60%)`;
                    ctx.fill();
                } else if (this.type === 'energy') {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, TAU);
                    ctx.fillStyle = `hsl(${this.hue}, 100%, 70%)`;
                    ctx.fill();
                    
                    // Energy aura
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * 3, 0, TAU);
                    ctx.fillStyle = `hsla(${this.hue}, 100%, 80%, 0.2)`;
                    ctx.fill();
                } else if (this.type === 'glow') {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * 2, 0, TAU);
                    ctx.fillStyle = `hsl(${this.hue}, 100%, 80%)`;
                    ctx.fill();
                }
                
                ctx.globalAlpha = 1;
            }
        }

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            centerX = canvas.width / 2;
            centerY = canvas.height / 2;
        };

        // Initialize particles - reduziert für Performance
        resize();
        for (let i = 0; i < 800; i++) {
            particles.push(new Particle(canvas));
        }

        const createExplosion = (x: number, y: number) => {
            explosions.push(new Explosion(x, y));
        };

        // Regular explosions
        setInterval(() => {
            createExplosion(
                centerX + (random() - 0.5) * 300,
                centerY + (random() - 0.5) * 300
            );
        }, 2000);

        // Mouse event handler für Explosionen bei Klick
        const handleClick = (e: MouseEvent) => {
            createExplosion(e.clientX, e.clientY);
        };

        // Create lightning beam
        let lightningPhase = 0;
        const drawLightning = (ctx: CanvasRenderingContext2D, x: number, y: number, length: number, angle: number, depth: number) => {
            if (depth <= 0) return;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            
            const x2 = x + cos(angle) * length;
            const y2 = y + sin(angle) * length;
            
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `hsl(260, 100%, 70%)`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Branches
            if (random() > 0.7) {
                drawLightning(ctx, x2, y2, length * 0.6, angle + (random() - 0.5) * 1, depth - 1);
            }
        };

        const draw = () => {
            tickRef.current++;
            lightningPhase += 0.03;
            
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw particles
            particles.forEach(p => {
                p.update();
                p.draw(ctx);
            });
            
            // Update and draw explosions
            for (let i = explosions.length - 1; i >= 0; i--) {
                const exp = explosions[i];
                exp.update();
                exp.draw(ctx);
                
                if (exp.isDead()) {
                    explosions.splice(i, 1);
                }
            }
            
            // Draw central energy beam - 2-3 Wellen, weniger Punkte
            ctx.beginPath();
            ctx.lineWidth = 4;
            
            const segments = 80; // Reduziert für bessere Performance
            const amplitude = 120;
            // 2-3 Wellen entlang der Säule (PI * 6 = 3 Wellen)
            for (let i = 0; i < segments; i++) {
                const progress = i / segments;
                const x = centerX + sin(progress * PI * 6 + tickRef.current * 0.015) * amplitude * (progress * 0.3 + 0.5);
                const y = centerY + (progress - 0.5) * 2 * centerY;
                const hue = 260 + sin(tickRef.current * 0.03 + i * 0.2) * 25;
                const alpha = abs(sin((tickRef.current + i * 10) * 0.03)) * 0.3 + 0.7;
                
                ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            // Add glow
            ctx.lineWidth = 12;
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = `hsla(260, 100%, 60%, 0.5)`;
            ctx.stroke();
            ctx.globalAlpha = 1;
            
            // Lightning strikes
            if (tickRef.current % 60 < 10) {
                const strikes = 3;
                for (let i = 0; i < strikes; i++) {
                    const sx = centerX + (random() - 0.5) * 400;
                    const sy = 0;
                    drawLightning(ctx, sx, sy, 100, PI / 2 + (random() - 0.5) * 0.3, 3);
                }
            }
            
            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        // Event listeners
        window.addEventListener("resize", resize);
        window.addEventListener("click", handleClick);

        // Cleanup
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            window.removeEventListener("resize", resize);
            window.removeEventListener("click", handleClick);
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
