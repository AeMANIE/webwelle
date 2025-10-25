"use strict";

const { PI, cos, sin, abs } = Math;

const HALF_PI = 0.5 * PI;
const TAU = 2 * PI;
const TO_RAD = PI / 180;

const fadeInOut = (t, m) => {
    let hm = 0.5 * m;
    return abs((t + hm) % m - hm) / hm;
};

let canvas;
let ctx;
let circles;
let origin;
let tick;
let mouseX = 0;
let mouseY = 0;
let isMouseActive = false;

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
    
    circles = [];
    origin = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
    tick = 0;
    
    resize();
    draw();
}

function resize() {
    canvas.a.width = canvas.b.width = window.innerWidth;
    canvas.a.height = canvas.b.height = window.innerHeight;
}

function getCircle(x, y, tick) {
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
            ctx.a.beginPath();
            ctx.a.lineWidth = 2;
            ctx.a.strokeStyle = `hsla(${this.hue}, 100%, 50%, ${fadeInOut(this.life, this.ttl)})`;
            ctx.a.arc(this.position.x, this.position.y, this.size, 0, TAU);
            ctx.a.stroke();
            ctx.a.closePath();
        }
    };
}

function draw() {
    tick++;
    
    // Clear canvases
    ctx.a.clearRect(0, 0, canvas.a.width, canvas.a.height);
    ctx.b.clearRect(0, 0, canvas.b.width, canvas.b.height);
    
    // Update origin position - SIMPLE LOGIC
    if (isMouseActive) {
        // Follow mouse
        const lerpFactor = 0.15;
        origin.x += (mouseX - origin.x) * lerpFactor;
        origin.y += (mouseY - origin.y) * lerpFactor;
    } else {
        // ALWAYS dance - no conditions, no time checks, nothing!
        const centerX = window.innerWidth * 0.5;
        const centerY = window.innerHeight * 0.5;
        const danceRadiusX = window.innerWidth * 0.25;
        const danceRadiusY = window.innerHeight * 0.125;
        
        origin.x = centerX + cos(tick * 0.025) * danceRadiusX;
        origin.y = centerY + sin(tick * 0.05) * danceRadiusY;
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
    
    // Apply blur and color effects
    ctx.b.save();
    ctx.b.filter = "blur(5px) saturate(200%) contrast(200%)";
    ctx.b.drawImage(canvas.a, 0, 0, canvas.b.width, canvas.b.height);
    ctx.b.restore();
    
    // Draw original image on top
    ctx.b.save();
    ctx.b.drawImage(canvas.a, 0, 0, canvas.b.width, canvas.b.height);
    ctx.b.restore();
    
    window.requestAnimationFrame(draw);
}

// Mouse and touch event handlers
function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isMouseActive = true;
}

function handleMouseLeave() {
    isMouseActive = false;
}

function handleMouseEnter() {
    isMouseActive = true;
}

// Touch event handlers
function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
        isMouseActive = true;
    }
}

function handleTouchEnd() {
    isMouseActive = false;
}

// Event listeners
window.addEventListener("load", setup);
window.addEventListener("resize", resize);
window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("mouseleave", handleMouseLeave);
window.addEventListener("mouseenter", handleMouseEnter);
window.addEventListener("touchmove", handleTouchMove, { passive: false });
window.addEventListener("touchend", handleTouchEnd);