import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "BusinessWelle buchen | WebWelle – Webdesign-Paket für wachsende Unternehmen",
  description: "BusinessWelle Webdesign-Paket buchen. Professionelle Website mit erweiterten Features für wachsende Unternehmen. Festpreis, transparent, modern.",
  keywords: "BusinessWelle buchen, Webdesign-Paket, Website für Unternehmen, WebWelle",
  authors: [{ name: "WebWelle" }],
  alternates: {
    canonical: 'https://webwelle.com/buchung/businesswelle',
  },
  openGraph: {
    title: "BusinessWelle buchen | WebWelle – Webdesign-Paket für wachsende Unternehmen",
    description: "BusinessWelle Webdesign-Paket buchen. Professionelle Website mit erweiterten Features für wachsende Unternehmen.",
    type: "website",
    locale: "de_DE",
    url: "https://webwelle.com/buchung/businesswelle",
  },
};

export default function BusinessWelleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
