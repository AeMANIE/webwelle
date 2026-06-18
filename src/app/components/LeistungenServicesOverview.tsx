'use client';

import Services from './Services';
import { LEISTUNGEN_PAGE_SERVICES } from './services-overview-data';

export default function LeistungenServicesOverview() {
  return (
    <Services
      services={LEISTUNGEN_PAGE_SERVICES}
      sectionId="leistungsuebersicht"
      className="relative z-10 -mt-2 pb-20 bg-background"
    />
  );
}
