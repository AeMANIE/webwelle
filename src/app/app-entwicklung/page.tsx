import type { Metadata } from 'next';
import AppEntwicklungClient from './AppEntwicklungClient';
import { ROBOTS_INDEX } from '@/lib/seo-index';

export const metadata: Metadata = {
  title: "App-Entwicklung Kempten (Allgäu) | WebWelle – Mobile Apps für Ihr Unternehmen",
  description: "Professionelle App-Entwicklung für Android & iOS aus Kempten. Individuelle Apps mit Festpreis, moderner Technologie und persönlicher Betreuung. Jetzt kostenloses Erstgespräch sichern!",
  keywords: "App-Entwicklung Kempten, Mobile App Allgäu, iOS App Entwicklung, Android App Entwicklung, App Agentur Bayern, WebWelle",
  authors: [{ name: "WebWelle" }],
  robots: ROBOTS_INDEX,
  alternates: {
    canonical: 'https://webwelle.com/app-entwicklung',
  },
  openGraph: {
    title: "App-Entwicklung Kempten (Allgäu) | WebWelle – Mobile Apps für Ihr Unternehmen",
    description: "Professionelle App-Entwicklung für Android & iOS aus Kempten. Individuelle Apps mit Festpreis und moderner Technologie.",
    type: "website",
    locale: "de_DE",
    url: "https://webwelle.com/app-entwicklung",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'App-Entwicklung Kempten (Allgäu) | WebWelle',
    description: 'Professionelle App-Entwicklung für Android & iOS aus Kempten. Individuelle Apps mit Festpreis.',
  },
};

export default function AppEntwicklungPage() {
  return <AppEntwicklungClient />;
}