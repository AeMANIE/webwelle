export type LeistungOffer = {
  id: string;
  title: string;
  tagline: string;
  paragraphs: [string, string];
  audienceHeading: string;
  audienceItems: string[];
  useCaseHeading: string;
  useCaseItems: string[];
  ctaHeading: string;
  ctaDescription: string;
  submitLabel: string;
  inputId: string;
  source: string;
};

export const LEISTUNGEN_OFFERS: LeistungOffer[] = [
  {
    id: 'digitale-wachstumsarchitektur',
    title: 'Digitale Wachstumsarchitektur',
    tagline:
      'Für Unternehmen, die ihren digitalen Auftritt als strategischen Umsatz- und Prozesshebel aufbauen wollen – nicht als digitale Kulisse.',
    paragraphs: [
      'Unternehmen mit Anspruch wollen nicht nur eine schöne Website, sondern ein digitales System, das qualifizierte Anfragen erzeugt, Abläufe messbar entlastet und Ihre Position im Markt stärkt. Im Fokus steht eine Gesamtarchitektur aus Markenauftritt, Conversion-Logik, strukturierter Kundenführung und intelligenten Prozessen im Hintergrund.',
      'Gemeinsam entwickeln wir eine digitale Infrastruktur, die Ihr Geschäftsmodell präzise abbildet: vom Erstkontakt über die Vorqualifizierung bis zu Kundenportal, Admin-Bereich und automatisierten Abläufen. Das Ergebnis ist ein professioneller Auftritt, der intern Effizienz schafft und extern das richtige Vertrauen erzeugt.',
    ],
    audienceHeading: 'Für wen es passt',
    audienceItems: [
      'Unternehmen mit erklärungsbedürftigen Leistungen und höherem Auftragswert',
      'Geschäftsführer und Teams, die Vertrieb, Kommunikation und Übergaben digital deutlich professioneller aufstellen wollen',
      'Dienstleister, Beratungen und B2B-Anbieter, die Qualität sichtbar machen und hochwertige Kunden gezielt anziehen möchten',
    ],
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
    submitLabel: 'Projekt beschreiben',
    inputId: 'leistungen-digitale-wachstumsarchitektur-industry',
    source: 'leistungen_digitale_wachstumsarchitektur',
  },
  {
    id: 'executive-ki-systeme',
    title: 'Executive KI-Systeme',
    tagline:
      'Für Geschäftsführer und Entscheider, die KI als verlässlichen Produktivitätsfaktor auf C-Level-Niveau einsetzen wollen – statt als weiteres Experiment.',
    paragraphs: [
      'Dieses Angebot ist für Entscheider konzipiert, die Verantwortung tragen, täglich zwischen Themen wechseln und belastbare Ergebnisse in kurzer Zeit brauchen. Statt einzelner Tools entsteht ein hochwertiges KI-System, das auf Ihre Rolle, Ihre Entscheidungslogik und Ihre Führungsrealität abgestimmt ist.',
      'Ziel ist eine Arbeitsumgebung, die im Alltag wirklich funktioniert: bei Vorbereitung, Kommunikation, Analyse und Priorisierung. Kein Experiment, sondern ein klar aufgebautes System – damit Sie schneller zu besseren Entscheidungen kommen und mehr Kapazität für das gewinnen, was nur Sie entscheiden können.',
    ],
    audienceHeading: 'Für wen es passt',
    audienceItems: [
      'Geschäftsführer und Unternehmer mit hoher Taktung, wenig Zeit und anspruchsvollen Entscheidungszyklen',
      'Entscheider, die Unterlagen, Kommunikation und Vorbereitung auf konstant hohem Niveau beschleunigen möchten',
      'Unternehmen, die KI strukturiert und wirksam in den Führungsalltag integrieren wollen – statt punktuell zu testen',
    ],
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
