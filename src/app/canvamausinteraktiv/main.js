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
let targetOrigin;
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
    targetOrigin = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
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

// Mouse event handlers
function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    targetOrigin.x = mouseX;
    targetOrigin.y = mouseY;
    isMouseActive = true;
}

function handleMouseLeave() {
    isMouseActive = false;
    // Return to center when mouse leaves
    targetOrigin.x = window.innerWidth * 0.5;
    targetOrigin.y = window.innerHeight * 0.5;
}

function handleMouseEnter() {
    isMouseActive = true;
}

// Event listeners
window.addEventListener("load", setup);
window.addEventListener("resize", resize);
window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("mouseleave", handleMouseLeave);
window.addEventListener("mouseenter", handleMouseEnter);