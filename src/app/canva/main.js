"use strict";

const { PI, cos, sin, abs, sqrt } = Math;

const HALF_PI = 0.5 * PI;
const TAU = 2 * PI;

const fadeInOut = (t, m) => {
    let hm = 0.5 * m;
    return abs((t + hm) % m - hm) / hm;
};

const lerp = (a, b, t) => a + (b - a) * t;

let canvas;
let ctx;
let waves = [];
let particles = [];
let tick;
let centerX, centerY;

// Wellen-Klasse für verschiedene Wellenmuster
class Wave {
    constructor(amplitude, frequency, speed, phase, color, thickness) {
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.speed = speed;
        this.phase = phase;
        this.color = color;
        this.thickness = thickness;
        this.alpha = 0.8;
    }

    getY(x, time) {
        return this.amplitude * sin(this.frequency * x + this.speed * time + this.phase);
    }

    draw(time, startX, endX, yOffset) {
        ctx.a.beginPath();
        ctx.a.strokeStyle = `hsla(${this.color}, 100%, 60%, ${this.alpha})`;
        ctx.a.lineWidth = this.thickness;
        
        const steps = 100;
        const stepSize = (endX - startX) / steps;
        
        for (let i = 0; i <= steps; i++) {
            const x = startX + i * stepSize;
            const y = centerY + yOffset + this.getY(x, time);
            
            if (i === 0) {
                ctx.a.moveTo(x, y);
            } else {
                ctx.a.lineTo(x, y);
            }
        }
        
        ctx.a.stroke();
    }
}

// Partikel-Klasse für Wellen-Effekte
class WaveParticle {
    constructor(x, y, waveIndex, speed, size, hue, life) {
        this.x = x;
        this.y = y;
        this.waveIndex = waveIndex;
        this.speed = speed;
        this.size = size;
        this.hue = hue;
        this.life = life;
        this.maxLife = life;
        this.alpha = 1;
        this.trail = [];
        this.maxTrailLength = 6;
        this.waveOffset = Math.random() * TAU;
    }

    update(waves) {
        // Wellen-Bewegung folgen
        if (waves[this.waveIndex]) {
            const wave = waves[this.waveIndex];
            this.x += this.speed;
            this.y = centerY + wave.getY(this.x, tick * 0.01) + this.waveOffset;
        }
        
        // Trail hinzufügen
        this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Life und Alpha
        this.life--;
        this.alpha = this.life / this.maxLife;
        
        // Größe pulsieren
        this.size *= 1.01;
        
        return this.life > 0 && this.x < window.innerWidth + 100;
    }

    draw() {
        // Trail zeichnen
        for (let i = 0; i < this.trail.length - 1; i++) {
            const point = this.trail[i];
            const nextPoint = this.trail[i + 1];
            const trailAlpha = (i / this.trail.length) * this.alpha * 0.7;
            
            ctx.a.beginPath();
            ctx.a.strokeStyle = `hsla(${this.hue}, 100%, 70%, ${trailAlpha})`;
            ctx.a.lineWidth = 2;
            ctx.a.moveTo(point.x, point.y);
            ctx.a.lineTo(nextPoint.x, nextPoint.y);
            ctx.a.stroke();
        }
        
        // Hauptpartikel
        ctx.a.beginPath();
        ctx.a.fillStyle = `hsla(${this.hue}, 100%, 80%, ${this.alpha})`;
        ctx.a.arc(this.x, this.y, this.size, 0, TAU);
        ctx.a.fill();
        
        // Glow-Effekt
        ctx.a.beginPath();
        ctx.a.fillStyle = `hsla(${this.hue}, 100%, 60%, ${this.alpha * 0.4})`;
        ctx.a.arc(this.x, this.y, this.size * 1.5, 0, TAU);
        ctx.a.fill();
    }
}

// Wellen-Kreise für zusätzliche Effekte
class WaveCircle {
    constructor(radius, waveCount, amplitude, speed, hue) {
        this.radius = radius;
        this.waveCount = waveCount;
        this.amplitude = amplitude;
        this.speed = speed;
        this.hue = hue;
        this.alpha = 0.6;
        this.rotation = 0;
    }

    update() {
        this.rotation += this.speed;
        this.alpha = 0.4 + 0.4 * sin(tick * 0.02);
    }

    draw() {
        const points = [];
        const steps = 64;
        
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * TAU + this.rotation;
            const waveOffset = this.amplitude * sin(this.waveCount * angle + tick * 0.01);
            const x = centerX + cos(angle) * (this.radius + waveOffset);
            const y = centerY + sin(angle) * (this.radius + waveOffset);
            points.push({ x, y });
        }
        
        // Wellen-Kreis zeichnen
        ctx.a.beginPath();
        ctx.a.strokeStyle = `hsla(${this.hue}, 100%, 70%, ${this.alpha})`;
        ctx.a.lineWidth = 3;
        
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            if (i === 0) {
                ctx.a.moveTo(point.x, point.y);
            } else {
                ctx.a.lineTo(point.x, point.y);
            }
        }
        ctx.a.closePath();
        ctx.a.stroke();
        
        // Innere Wellen
        ctx.a.beginPath();
        ctx.a.strokeStyle = `hsla(${this.hue}, 100%, 80%, ${this.alpha * 0.6})`;
        ctx.a.lineWidth = 1;
        
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const nextPoint = points[(i + 1) % points.length];
            const midX = (point.x + nextPoint.x) / 2;
            const midY = (point.y + nextPoint.y) / 2;
            const innerRadius = this.radius * 0.7;
            const innerX = centerX + cos(atan2(midY - centerY, midX - centerX)) * innerRadius;
            const innerY = centerY + sin(atan2(midY - centerY, midX - centerX)) * innerRadius;
            
            if (i === 0) {
                ctx.a.moveTo(innerX, innerY);
            } else {
                ctx.a.lineTo(innerX, innerY);
            }
        }
        ctx.a.closePath();
        ctx.a.stroke();
    }
}

function setup() {
    canvas = {
        a: document.createElement('canvas'),
        b: document.createElement('canvas')
    };
    
    ctx = {
        a: canvas.a.getContext('2d'),
        b: canvas.b.getContext('2d')
    };
    
    canvas.b.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: black;
    `;
    
    document.body.appendChild(canvas.b);
    
    waves = [];
    particles = [];
    tick = 0;
    
    // Verschiedene Wellen erstellen
    createWaves();
    
    resize();
    draw();
}

function createWaves() {
    // Hauptwellen
    waves.push(new Wave(80, 0.02, 0.03, 0, 0, 4));        // Rot
    waves.push(new Wave(60, 0.03, 0.02, HALF_PI, 60, 3)); // Gelb
    waves.push(new Wave(40, 0.04, 0.04, PI, 120, 2));     // Grün
    waves.push(new Wave(100, 0.015, 0.025, 1.5 * PI, 180, 5)); // Cyan
    waves.push(new Wave(30, 0.05, 0.035, 0.5 * PI, 240, 2));   // Blau
    waves.push(new Wave(70, 0.025, 0.015, 0.75 * PI, 300, 3)); // Magenta
}

function resize() {
    canvas.a.width = canvas.b.width = window.innerWidth;
    canvas.a.height = canvas.b.height = window.innerHeight;
    centerX = window.innerWidth * 0.5;
    centerY = window.innerHeight * 0.5;
}

function createWaveParticle() {
    if (tick % 3 === 0) {
        const waveIndex = Math.floor(Math.random() * waves.length);
        const wave = waves[waveIndex];
        const x = -50;
        const y = centerY + wave.getY(x, tick * 0.01);
        const hue = wave.color + (Math.random() - 0.5) * 30;
        
        particles.push(new WaveParticle(
            x,
            y,
            waveIndex,
            2 + Math.random() * 3,
            2 + Math.random() * 4,
            hue,
            200 + Math.random() * 150
        ));
    }
}

function createWaveCircle() {
    if (tick % 120 === 0) {
        const radius = 150 + Math.random() * 200;
        const waveCount = 3 + Math.floor(Math.random() * 4);
        const amplitude = 20 + Math.random() * 40;
        const hue = (tick * 0.2) % 360;
        
        particles.push(new WaveCircle(radius, waveCount, amplitude, 0.01, hue));
    }
}

function draw() {
    tick++;
    
    // Clear canvases
    ctx.a.clearRect(0, 0, canvas.a.width, canvas.a.height);
    ctx.b.clearRect(0, 0, canvas.b.width, canvas.b.height);
    
    // Center bewegen sich sanft
    centerX = window.innerWidth * 0.5 + sin(tick * 0.005) * 30;
    centerY = window.innerHeight * 0.5 + cos(tick * 0.008) * 20;
    
    // Wellen zeichnen
    const time = tick * 0.01;
    const startX = -100;
    const endX = window.innerWidth + 100;
    
    for (let i = 0; i < waves.length; i++) {
        const wave = waves[i];
        const yOffset = (i - waves.length / 2) * 40;
        wave.draw(time, startX, endX, yOffset);
    }
    
    // Neue Partikel erstellen
    createWaveParticle();
    createWaveCircle();
    
    // Partikel aktualisieren und zeichnen
    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].update) {
            if (particles[i].update(waves)) {
                particles[i].draw();
            } else {
                particles.splice(i, 1);
            }
        } else {
            // WaveCircle hat kein update, nur draw
            particles[i].draw();
        }
    }
    
    // Verbindungslinien zwischen Wellen
    for (let i = 0; i < waves.length - 1; i++) {
        const steps = 50;
        const stepSize = (endX - startX) / steps;
        
        for (let j = 0; j <= steps; j += 5) {
            const x = startX + j * stepSize;
            const y1 = centerY + waves[i].getY(x, time) + (i - waves.length / 2) * 40;
            const y2 = centerY + waves[i + 1].getY(x, time) + ((i + 1) - waves.length / 2) * 40;
            
            const alpha = 0.3 * (1 - j / steps);
            ctx.a.beginPath();
            ctx.a.strokeStyle = `hsla(${(waves[i].color + waves[i + 1].color) / 2}, 100%, 60%, ${alpha})`;
            ctx.a.lineWidth = 1;
            ctx.a.moveTo(x, y1);
            ctx.a.lineTo(x, y2);
            ctx.a.stroke();
        }
    }
    
    // Blur und Farbeffekte
    ctx.b.save();
    ctx.b.filter = "blur(2px) saturate(180%) contrast(110%)";
    ctx.b.drawImage(canvas.a, 0, 0, canvas.b.width, canvas.b.height);
    ctx.b.restore();
    
    // Original auf top
    ctx.b.save();
    ctx.b.drawImage(canvas.a, 0, 0, canvas.b.width, canvas.b.height);
    ctx.b.restore();
    
    window.requestAnimationFrame(draw);
}

// Event listeners
window.addEventListener("load", setup);
window.addEventListener("resize", resize);