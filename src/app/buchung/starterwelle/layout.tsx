import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "StarterWelle buchen | WebWelle – Webdesign-Paket für den schnellen Start",
  description: "StarterWelle Webdesign-Paket buchen. Perfekte Website für den schnellen Online-Start. Festpreis, transparent, modern.",
  keywords: "StarterWelle buchen, Webdesign-Paket, Website für Start, WebWelle",
  authors: [{ name: "WebWelle" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://webwelle.com/buchung/starterwelle',
  },
  openGraph: {
    title: "StarterWelle buchen | WebWelle – Webdesign-Paket für den schnellen Start",
    description: "StarterWelle Webdesign-Paket buchen. Perfekte Website für den schnellen Online-Start.",
    type: "website",
    locale: "de_DE",
    url: "https://webwelle.com/buchung/starterwelle",
  },
};

export default function StarterWelleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
