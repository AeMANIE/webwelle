'use client';

import Services from './Services';
import { LEISTUNGEN_PAGE_SERVICES } from './services-overview-data';

export default function LeistungenServicesOverview() {
  return (
    <Services
      services={LEISTUNGEN_PAGE_SERVICES}
      sectionId="leistungsuebersicht"
      className="relative z-10 bg-background pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24"
    />
  );
}
