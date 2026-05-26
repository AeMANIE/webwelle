"use strict";

const { PI, sin, cos, random } = Math;

let canvas;
let ctx;
let tick = 0;
let centerX = 0;
let centerY = 0;
let baseRadius = 150;
let numLines = 360;
let lines = [];

function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    resize();
    createLines();
    animate();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
    
    // Passe Basis-Radius an Bildschirmgröße an
    baseRadius = Math.min(canvas.width, canvas.height) * 0.2;
    
    createLines();
}

function createLines() {
    lines = [];
    for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * PI * 2;
        lines.push({
            angle: angle,
            phase: random() * PI * 2,
            baseLength: 0
        });
    }
}

function animate() {
    tick++;
    
    // Clear canvas - transparent (kein Hintergrund)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Zeichne alle Linien
    lines.forEach((line, index) => {
        const angle = line.angle;
        
        // Berechne Position auf dem Ring
        const radius = baseRadius;
        const startX = centerX + cos(angle) * radius;
        const startY = centerY + sin(angle) * radius;
        
        // Berechne Länge basierend auf Position (wie im Bild beschrieben)
        // Längste Linien oben/unten (vertikal), kürzeste links/rechts (horizontal)
        let lengthMultiplier = 1;
        
        // Normalisiere Winkel zu 0-2PI
        let normalizedAngle = angle;
        if (normalizedAngle < 0) normalizedAngle += PI * 2;
        
        // Berechne Abstand von vertikaler Achse (oben/unten = 0, links/rechts = 1)
        const verticalDistance = Math.abs(sin(angle));
        const horizontalDistance = Math.abs(cos(angle));
        
        // Länge variiert: längste bei vertikaler Position (oben/unten)
        // Kürzeste bei horizontaler Position (links/rechts)
        const baseLengthFactor = verticalDistance; // 1.0 oben/unten, 0.0 links/rechts
        
        // Audio-Visualizer-Effekt: Pulsierende Wellen
        const wave1 = sin(tick * 0.02 + index * 0.1 + line.phase) * 0.4;
        const wave2 = sin(tick * 0.015 + index * 0.15) * 0.3;
        const wave3 = sin(tick * 0.025 + index * 0.05) * 0.2;
        
        // Kombiniere Basis-Länge mit Wellen-Effekt
        const dynamicLength = baseLengthFactor * (0.4 + wave1 + wave2 + wave3);
        const lineLength = dynamicLength * 80; // Maximale Länge
        
        // Mindestlänge für sichtbare Linien
        if (lineLength < 3) return;
        
        // Berechne Endpunkt (radial nach außen)
        const endX = startX + cos(angle) * lineLength;
        const endY = startY + sin(angle) * lineLength;
        
        // Linienbreite variiert mit Länge
        const lineWidth = Math.max(1, Math.min(3, lineLength * 0.02));
        
        // Zeichne Schatten (leicht versetzt nach rechts/unten) - farbig
        ctx.beginPath();
        ctx.moveTo(startX + 1, startY + 1);
        ctx.lineTo(endX + 1, endY + 1);
        
        // Farbiger Schatten basierend auf Position und Zeit
        const shadowHue = (tick * 0.5 + index * 2) % 360;
        ctx.strokeStyle = `hsla(${shadowHue}, 100%, 50%, 0.2)`;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Zeichne Hauptlinie
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        
        // Farbige Linien ähnlich wie canvamausinteraktiv
        const intensity = Math.max(0.3, Math.min(1, dynamicLength));
        // Hue rotiert durch das Spektrum basierend auf Position und Zeit
        const hue = (tick * 0.5 + index * 2) % 360;
        // Saturation und Lightness für lebendige Farben
        const saturation = 100;
        const lightness = 50;
        const alpha = 0.6 + intensity * 0.4;
        
        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
    });
    
    requestAnimationFrame(animate);
}

// Event Listeners
window.addEventListener('resize', resize);

// Start
document.addEventListener('DOMContentLoaded', init);

