'use client';

import { useEffect } from 'react';

export default function PerformanceOptimizer() {
  useEffect(() => {
    // Preload wichtige Ressourcen nach dem ersten Render
    const preloadResources = () => {
      // Preload Stripe nur wenn benötigt
      if (typeof window !== 'undefined' && !window.stripeLoaded) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = 'https://js.stripe.com/v3/';
        link.as = 'script';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
        
        window.stripeLoaded = true;
      }
    };

    // Preload nach 2 Sekunden (nach kritischen Ressourcen)
    const timer = setTimeout(preloadResources, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

// TypeScript declaration für window
declare global {
  interface Window {
    stripeLoaded?: boolean;
  }
}
