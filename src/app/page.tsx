import HomePageView from './components/HomePageView';
import type { Metadata } from 'next';
import { ROBOTS_INDEX } from '@/lib/seo-index';

export const metadata: Metadata = {
  title: "Webdesign Kempten (Allgäu) | WebWelle – Professionelle Websites für mehr Anfragen",
  description:
    "WebWelle entwickelt professionelle Websites für Selbstständige und Unternehmen im Allgäu – klar aufgebaut, auf Vertrauen ausgerichtet, für mehr Anfragen.",
  keywords: "Webdesign Kempten, Webdesign Allgäu, Website erstellen Kempten, SEO Agentur Allgäu, Festpreis Webdesign, Webdesign Bayern",
  authors: [{ name: "WebWelle" }],
  robots: ROBOTS_INDEX,
  alternates: {
    canonical: 'https://webwelle.com',
  },
  openGraph: {
    title: "Webdesign Kempten (Allgäu) | WebWelle – Professionelle Websites für mehr Anfragen",
    description:
      "WebWelle entwickelt professionelle Websites für Selbstständige und Unternehmen im Allgäu – klar aufgebaut, auf Vertrauen ausgerichtet, für mehr Anfragen.",
    type: "website",
    locale: "de_DE",
    url: "https://webwelle.com",
  },
};

export default function Home() {
  return <HomePageView />;
}
