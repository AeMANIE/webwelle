'use client';

import { GlowCard } from '@/components/ui/spotlight-card';
import { useLayoutCssWidth, useLayoutMode } from '@/hooks/useLayoutMode';
import { getServicesGridClass } from '@/lib/responsive-layout-mode';
import { ServicesMobileGlowProvider } from './ServicesMobileGlowContext';
import {
  HOMEPAGE_SERVICES,
  type ServiceOverviewItem,
} from './services-overview-data';

type ServicesProps = {
  services?: ServiceOverviewItem[];
  sectionId?: string;
  heading?: string;
  className?: string;
};

export default function Services({
  services = HOMEPAGE_SERVICES,
  sectionId = 'leistungen',
  heading = 'Leistungsübersicht',
  className = 'py-20 bg-background',
}: ServicesProps) {
  const layoutMode = useLayoutMode();
  const cssWidth = useLayoutCssWidth();
  const gridClass = getServicesGridClass(layoutMode, cssWidth);

  return (
    <section id={sectionId} className={className}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            {heading}
          </h2>
        </div>

        <ServicesMobileGlowProvider sectionId={sectionId}>
        <div className={`grid ${gridClass} gap-8 overflow-visible`}>
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div key={index} className="group overflow-visible">
                <GlowCard
                  glowColor="blueViolet"
                  customSize
                  glowIndex={index}
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
        </ServicesMobileGlowProvider>
      </div>
    </section>
  );
}
