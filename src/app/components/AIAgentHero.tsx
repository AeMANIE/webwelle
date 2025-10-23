'use client';

import { Bot, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import CanvaAnimation from './CanvaAnimation';

export default function AIAgentHero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Canva Animation Background */}
      <CanvaAnimation />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 z-10" />
      
      {/* Content Container */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Glassmorphism Text Window */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              KI-Agenten für digitale Marktführer
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              Automatisieren Sie Ihr{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Wachstum
              </span>
              <br />
              mit WebWelle KI-Agenten!
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto font-light leading-relaxed mb-8">
              <strong className="text-primary font-semibold">WebWelle – Ihre Erfolgswelle im Netz</strong>
              <br />
              Festpreis-Webdesign und smarte KI-Agenten für digitale Marktführer in Deutschland. 
              <span className="block mt-2 text-lg text-white/80">
                Individuell. Transparent. Modern.
              </span>
            </p>
          </div>

          {/* Feature Box */}
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center justify-center gap-3">
              <Bot className="w-7 h-7 text-primary" />
              Ihr KI-Agent von WebWelle
            </h2>
            <p className="text-lg text-white/90 mb-3 font-medium">
              — Zeit gewinnen. Kunden begeistern. Vorsprung sichern.
            </p>
            <p className="text-white/80 leading-relaxed">
              Nutzen Sie den entscheidenden Vorsprung: Automatisieren Sie Ihr Business – rund um die Uhr, 
              ohne Zusatzaufwand, perfekt abgestimmt auf Ihre Prozesse und Wachstumsziele.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/buchung/flowwelle"
              className="group bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
            >
              Wellenstart beginnen
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#ai-agent-produkte"
              className="group bg-white/10 hover:bg-white/20 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center justify-center gap-2"
            >
              Pakete entdecken
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
