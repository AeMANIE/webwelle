'use client';

import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const InfiniteTunnelAnimation = dynamic(() => import('./InfiniteTunnelAnimation'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-background" />
});

const InfiniteTunnelAnimationMobile = dynamic(() => import('./InfiniteTunnelAnimation_2622x1206'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-background" />
});

export default function AIAgentHero() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className="relative flex items-center justify-center overflow-hidden h-auto min-h-[500px] sm:h-screen sm:min-h-[700px] md:h-screen isolate py-12">
      {/* Infinite Tunnel Animation Background - Responsive */}
      <div className="absolute inset-0 overflow-hidden">
        {isMobile ? (
          <InfiniteTunnelAnimationMobile />
        ) : (
          <InfiniteTunnelAnimation />
        )}
      </div>
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" style={{ zIndex: 10 }} />
      
      {/* Content Container */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 sm:py-12 md:py-16">
        {/* Glassmorphism Text Window */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              KI-Agenten aus dem Allgäu
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              Mehr Kunden,{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                weniger Aufwand
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto font-light leading-relaxed mb-8">
              Viele Unternehmer verlieren täglich wertvolle Zeit mit wiederkehrenden Aufgaben.
              <span className="block mt-2 text-lg text-white/80">
                Die Lösung: Ihr persönlicher KI-Agent von WebWelle, entwickelt in Kempten (Allgäu).
              </span>
            </p>
          </div>

          {/* Feature Box */}
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <p className="text-lg text-white/90 font-medium mb-4">
              Er automatisiert Routineprozesse, beantwortet Kundenanfragen sofort und sorgt für messbares Wachstum – 
              <span className="text-primary font-semibold"> 24 Stunden am Tag, 365 Tage im Jahr.</span>
            </p>
            <p className="text-white/80 leading-relaxed font-light italic">
              "Automatisieren Sie Ihr Wachstum – einfach, sicher und individuell."
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/buchung/flowwelle"
              className="group bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
            >
              Jetzt unverbindliches Beratungsgespräch sichern
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#ai-explanation"
              className="group bg-white/10 hover:bg-white/20 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center justify-center gap-2"
            >
              Mehr erfahren
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className="mt-12 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
