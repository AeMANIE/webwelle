'use client';

import { useState } from 'react';
import CanvaAnimation_2622x1206 from '../components/CanvaAnimation_2622x1206';
import InfiniteTunnelAnimation_2622x1206 from '../components/InfiniteTunnelAnimation_2622x1206';

export default function TestAnimationsPage() {
  const [activeAnimation, setActiveAnimation] = useState<'canva' | 'tunnel'>('canva');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Canvas Animation Test - 2622x1206
          </h1>
          
          {/* Toggle Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setActiveAnimation('canva')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeAnimation === 'canva'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Canva Animation (Punkte)
            </button>
            <button
              onClick={() => setActiveAnimation('tunnel')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeAnimation === 'tunnel'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Infinite Tunnel (Kreise)
            </button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Größe: 1206 x 2622 Pixel (Höhe x Breite) - Responsive | Bewegen Sie die Maus über die Animation für Interaktion
          </p>
        </div>
      </div>

      {/* Animation Container */}
      <div className="relative bg-black">
        <div className="flex justify-center items-center min-h-[calc(100vh-120px)] p-4">
          <div className="relative w-full max-w-[90vw] border-2 border-primary/20 rounded-lg" style={{ maxHeight: '80vh' }}>
            {activeAnimation === 'canva' && (
              <CanvaAnimation_2622x1206 withOverlay={false} />
            )}
            {activeAnimation === 'tunnel' && (
              <InfiniteTunnelAnimation_2622x1206 />
            )}
            
            {/* Overlay mit Größen-Info */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-mono z-10 pointer-events-none">
              1206 × 2622 (H×B)
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-card border-t border-border p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Canva Animation</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Blaue Punkte mit Wave-Muster</li>
                <li>• Maus-Interaktion mit Ripple-Effekt</li>
                <li>• Trail-Effekt durch Fade</li>
                <li>• Glow-Effekt bei hoher Intensität</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Infinite Tunnel</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Expandierende Kreise</li>
                <li>• Farbverlauf basierend auf Zeit</li>
                <li>• Tanzende Bewegung ohne Maus</li>
                <li>• Blur- und Saturation-Effekte</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
