import type { Metadata } from 'next';
import { ROBOTS_NOINDEX } from '@/lib/seo-index';

export const metadata: Metadata = {
  title: "ErfolgsWelle buchen | WebWelle – Premium Webdesign-Paket für Marktführer",
  description: "ErfolgsWelle Webdesign-Paket buchen. Premium Website mit allen Features für Marktführer. Festpreis, transparent, modern.",
  keywords: "ErfolgsWelle buchen, Premium Webdesign-Paket, Website für Marktführer, WebWelle",
  authors: [{ name: "WebWelle" }],
  robots: ROBOTS_NOINDEX,
  alternates: {
    canonical: 'https://webwelle.com/buchung/erfolgswelle',
  },
  openGraph: {
    title: "ErfolgsWelle buchen | WebWelle – Premium Webdesign-Paket für Marktführer",
    description: "ErfolgsWelle Webdesign-Paket buchen. Premium Website mit allen Features für Marktführer.",
    type: "website",
    locale: "de_DE",
    url: "https://webwelle.com/buchung/erfolgswelle",
  },
};

export default function ErfolgsWelleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
