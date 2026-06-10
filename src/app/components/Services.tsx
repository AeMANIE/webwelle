'use client';

import { Palette, Search, Target, FileText, Brush, Bot } from 'lucide-react';
import { GlowCard } from '@/components/ui/spotlight-card';

export default function Services() {
  const services = [
    {
      icon: Palette,
      title: 'Webdesign',
      description:
        'Professionelle Websites mit klarer Struktur, modernem Auftritt und einer Nutzerführung, die Vertrauen schafft.',
    },
    {
      icon: Search,
      title: 'SEO-Basis',
      description:
        'Eine starke Grundlage für bessere Sichtbarkeit bei Google, damit Ihre Website regional und thematisch sauber aufgestellt ist.',
    },
    {
      icon: Target,
      title: 'SEO-Profi',
      description:
        'Für Unternehmen, die gezielt mehr Reichweite, bessere Rankings und mehr qualifizierte Anfragen gewinnen möchten.',
    },
    {
      icon: FileText,
      title: 'Inhalte',
      description:
        'Texte und Seitenstrukturen, die verständlich sind, seriös wirken und Ihr Angebot klar auf den Punkt bringen.',
    },
    {
      icon: Brush,
      title: 'Branding',
      description:
        'Ein einheitlicher Außenauftritt, der Ihre Marke professionell zeigt und Wiedererkennung schafft.',
    },
    {
      icon: Bot,
      title: 'Automatisierung',
      description:
        'Sinnvolle digitale Abläufe, die Anfragen, Kontaktprozesse oder interne Schritte effizienter und zeitsparender machen.',
    },
  ];

  return (
    <section id="leistungen" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Leistungsübersicht
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-visible">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div key={index} className="group overflow-visible">
                <GlowCard
                  glowColor="blueViolet"
                  customSize
                  className="h-full w-full p-6"
                >
                  <div className="relative z-10 flex h-full flex-col items-center text-center">
                    <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 text-center">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed font-light text-center">
                      {service.description}
                    </p>
                  </div>
                </GlowCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
