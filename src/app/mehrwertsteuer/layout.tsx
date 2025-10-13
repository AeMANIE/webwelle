import type { Metadata } from "next";

const year = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Mehrwertsteuer-Rechner ${year} | Brutto, Netto + MwSt berechnen | WebWelle`,
  description: "Kostenloser Mehrwertsteuer-Rechner für Deutschland, Österreich & Schweiz. Berechnen Sie Brutto, Netto und MwSt mit 19%, 7%, 20%, 10%, 8.1%, 3.8%, 2.6% oder eigenem Steuersatz. Sofortige Berechnung mit Copy-Funktion.",
  keywords: `Mehrwertsteuer Rechner, MwSt berechnen, Brutto Netto Rechner, Steuerrechner ${year}, Umsatzsteuer, Deutschland 19% 7%, Österreich 20% 10%, Schweiz 8.1% 3.8% 2.6%, kostenlos, WebWelle`,
  authors: [{ name: "WebWelle" }],
  creator: "WebWelle",
  publisher: "WebWelle",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://webwelle.com/mehrwertsteuer',
    siteName: 'WebWelle',
    title: `Mehrwertsteuer-Rechner ${year} | Brutto, Netto + MwSt berechnen`,
    description: 'Kostenloser Mehrwertsteuer-Rechner für Deutschland, Österreich & Schweiz. Berechnen Sie Brutto, Netto und MwSt mit verschiedenen Steuersätzen.',
    images: [
      {
        url: 'https://webwelle.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'WebWelle Mehrwertsteuer-Rechner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Mehrwertsteuer-Rechner ${year} | Brutto, Netto + MwSt berechnen`,
    description: 'Kostenloser Mehrwertsteuer-Rechner für Deutschland, Österreich & Schweiz.',
    images: ['https://webwelle.com/logo.png'],
  },
  alternates: {
    canonical: 'https://webwelle.com/mehrwertsteuer',
  },
  category: 'Finance',
};

export default function MehrwertsteuerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
