"use strict";

const { PI, sin, cos, abs, random, sqrt } = Math;
const TAU = 2 * PI;

let canvas;
let ctx;
let centerX, centerY;
let tick = 0;
let mouseX = 0;
let mouseY = 0;
const explosions = [];
const particles = [];

// Explosion Class - für spektakuläre Effekte
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 0;
        this.maxLife = 60;
        this.particles = [];
        
        // Erstelle viele Partikel für die Explosion
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * TAU;
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
    
    draw() {
        const alpha = 1 - (this.life / this.maxLife);
        
        this.particles.forEach(p => {
            const pAlpha = (p.life / 60) * alpha;
            ctx.globalAlpha = pAlpha;
            
            ctx.beginPath();
            ctx.arc(p.x + this.x, p.y + this.y, p.size, 0, TAU);
            ctx.fillStyle = `hsl(${p.hue}, 100%, 60%)`;
            ctx.fill();
            
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

// Particle Class
class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = random() * canvas.width;
        this.y = random() * canvas.height;
        this.vx = (random() - 0.5) * 0.5;
        this.vy = (random() - 0.5) * 0.5;
        this.size = random() * 3 + 1;
        this.hue = 260 + random() * 60;
        this.alpha = random() * 0.5 + 0.3;
        this.type = ['spark', 'energy', 'glow'][Math.floor(random() * 3)];
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
        
        this.alpha = abs(sin(tick * 0.05 + this.x * 0.01)) * 0.5 + 0.3;
    }
    
    draw() {
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

function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    resize();
    
    // Create particles
    for (let i = 0; i < 1500; i++) {
        particles.push(new Particle());
    }
    
    animate();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
}

function createExplosion(x, y) {
    explosions.push(new Explosion(x, y));
}

function drawLightning(x, y, length, angle, depth) {
    if (depth <= 0) return;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    const x2 = x + cos(angle) * length;
    const y2 = y + sin(angle) * length;
    
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsl(260, 100%, 70%)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    if (random() > 0.7) {
        drawLightning(x2, y2, length * 0.6, angle + (random() - 0.5) * 1, depth - 1);
    }
}

let lightningPhase = 0;

function animate() {
    tick++;
    lightningPhase += 0.03;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw particles
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    
    // Draw explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.update();
        exp.draw();
        
        if (exp.isDead()) {
            explosions.splice(i, 1);
        }
    }
    
    // Draw central energy beam - reduzierte Wellen
    ctx.beginPath();
    ctx.lineWidth = 4;
    
    const segments = 150;
    const amplitude = 120;
    // 2-3 Wellen entlang der Säule
    for (let i = 0; i < segments; i++) {
        const progress = i / segments;
        const x = centerX + sin(progress * PI * 2.5 + tick * 0.02) * amplitude * (progress * 0.3 + 0.5);
        const y = centerY + (progress - 0.5) * 2 * centerY;
        const hue = 260 + sin(tick * 0.03 + i * 0.15) * 25;
        const alpha = abs(sin((tick + i * 8) * 0.03)) * 0.3 + 0.7;
        
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
    if (tick % 60 < 10) {
        const strikes = 3;
        for (let i = 0; i < strikes; i++) {
            const sx = centerX + (random() - 0.5) * 400;
            const sy = 0;
            drawLightning(sx, sy, 100, PI / 2 + (random() - 0.5) * 0.3, 3);
        }
    }
    
    requestAnimationFrame(animate);
}

// Event Listeners
window.addEventListener('resize', resize);
window.addEventListener('click', (e) => {
    createExplosion(e.clientX, e.clientY);
});

// Regular explosions
setInterval(() => {
    createExplosion(
        centerX + (random() - 0.5) * 300,
        centerY + (random() - 0.5) * 300
    );
}, 2000);

// Start
document.addEventListener('DOMContentLoaded', init);
