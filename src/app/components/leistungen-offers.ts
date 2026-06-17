export type LeistungOffer = {
  id: string;
  title: string;
  tagline: string;
  audienceHeading: string;
  audienceText?: string;
  audienceItems: string[];
  useCaseHeading: string;
  useCaseItems: string[];
  ctaHeading: string;
  ctaDescription: string;
  submitLabel: string;
  inputId: string;
  source: string;
  funnelKind?: 'wachstumsarchitektur';
};

export const LEISTUNGEN_OFFERS: LeistungOffer[] = [
  {
    id: 'digitale-wachstumsarchitektur',
    title: 'Digitale Wachstumsarchitektur',
    tagline:
      'Für Unternehmen, die ihren digitalen Auftritt als strategischen Umsatz- und Prozesshebel aufbauen wollen – nicht als digitale Kulisse.',
    audienceHeading: 'Für wen es passt',
    audienceText:
      'Für Unternehmen mit erklärungsbedürftigen Leistungen und höherem Auftragswert – Dienstleister, Beratungen und B2B-Anbieter, die Qualität sichtbar machen, hochwertige Kunden gezielt anziehen und Vertrieb, Kommunikation sowie Übergaben digital professioneller aufstellen wollen.',
    audienceItems: [],
    useCaseHeading: 'Typische Einsatzfelder',
    useCaseItems: [
      'Premium-Unternehmenswebsite mit klarer Positionierung, starker Vertrauenswirkung und präziser Conversion-Führung',
      'Strategische Funnels für Analysegespräch, Angebotsstrecke oder qualifizierte Erstberatung',
      'Exklusives Kundenportal und Admin-Dashboard für strukturierte Zusammenarbeit auf professionellem Niveau',
      'Automatisierte Prozessstrecken für Onboarding, Angebotsprozesse, Termine und interne Abstimmung',
    ],
    ctaHeading: 'Projekt beschreiben',
    ctaDescription:
      'Beschreiben Sie kurz, welche digitale Struktur Sie aufbauen möchten – und an welchen Stellen fehlende Klarheit, Medienbrüche oder manuelle Abläufe heute Wachstum und Effizienz begrenzen.',
    submitLabel: 'Projekt beschreiben starten',
    inputId: 'leistungen-digitale-wachstumsarchitektur-industry',
    source: 'leistungen_digitale_wachstumsarchitektur',
    funnelKind: 'wachstumsarchitektur',
  },
  {
    id: 'executive-ki-systeme',
    title: 'Executive KI-Systeme',
    tagline:
      'Für Geschäftsführer und Entscheider, die KI als verlässlichen Produktivitätsfaktor auf C-Level-Niveau einsetzen wollen – statt als weiteres Experiment.',
    audienceHeading: 'Für wen es passt',
    audienceText:
      'Für Geschäftsführer und Unternehmer mit hoher Taktung und wenig Zeit, die Unterlagen, Kommunikation und Vorbereitung auf konstant hohem Niveau beschleunigen und KI strukturiert sowie wirksam in ihren Führungsalltag integrieren wollen – statt punktuell zu testen.',
    audienceItems: [],
    useCaseHeading: 'Typische Einsatzfelder',
    useCaseItems: [
      'KI-gestützte Vorbereitung von E-Mails, Angeboten, Präsentationen und Entscheidungsunterlagen',
      'Persönliche Executive-Arbeitsumgebung für Recherche, Strukturierung, Wissensmanagement und Priorisierung',
      'Individuelle Assistenten, Vorlagen und Prozessketten für wiederkehrende Abstimmungen und Führungsaufgaben',
      'Verlässliche KI-Strukturen für tägliche Nutzung in Management, Vertrieb und operativer Steuerung',
    ],
    ctaHeading: 'Bedarf einordnen',
    ctaDescription:
      'Beschreiben Sie kurz, in welchen Bereichen Sie aktuell die meiste Zeit verlieren – und wo ein professionelles KI-System Ihnen spürbar mehr Klarheit, Tempo und Entscheidungssicherheit bringen soll.',
    submitLabel: 'Bedarf einordnen',
    inputId: 'leistungen-executive-ki-systeme-industry',
    source: 'leistungen_executive_ki',
  },
];
