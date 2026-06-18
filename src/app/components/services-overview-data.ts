import {
  Palette,
  Search,
  Target,
  FileText,
  Brush,
  Bot,
  Languages,
  Layers,
  CalendarCheck,
  Database,
  Workflow,
  MousePointerClick,
  type LucideIcon,
} from 'lucide-react';

export type ServiceOverviewItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const HOMEPAGE_SERVICES: ServiceOverviewItem[] = [
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

export const LEISTUNGEN_PAGE_SERVICES: ServiceOverviewItem[] = [
  {
    icon: Languages,
    title: 'Mehrsprachige Umsetzung',
    description:
      'Internationale Websites mit sauber strukturierten Sprachversionen.',
  },
  {
    icon: Layers,
    title: 'Größere Websiteprojekte',
    description:
      'Mehrstufige Auftritte mit vielen Seiten, Bereichen oder Nutzerrollen.',
  },
  {
    icon: CalendarCheck,
    title: 'Spezielle Formulare & Buchungssysteme',
    description:
      'Individuelle Eingabemasken, Terminbuchung, Anfragekonfiguratoren.',
  },
  {
    icon: Database,
    title: 'CRM-Anbindung',
    description:
      'Verbindung zu bestehenden CRM-Systemen für strukturierte Kundendaten.',
  },
  {
    icon: Workflow,
    title: 'Komplexe Automatisierungen',
    description:
      'Mehrstufige Workflows mit externen Systemen, APIs und abgestimmten Prozessen.',
  },
  {
    icon: MousePointerClick,
    title: 'UX- & Interaktionskonzepte',
    description:
      'Durchdachte Nutzererlebnisse für komplexe Produkte, Portale oder Plattformen.',
  },
];
