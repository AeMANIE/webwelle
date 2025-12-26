import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://webwelle.com'),
  title: "Webdesign Kempten (Allgäu) | WebWelle – Sichtbar. Modern. Erfolgreich.",
  description: "Webdesign aus Kempten im Allgäu. SEO-optimierte Websites mit Festpreis, garantierter Performance & persönlicher Betreuung. Jetzt kostenloses Erstgespräch sichern!",
  keywords: "Webdesign Kempten, Webdesign Allgäu, Website erstellen Kempten, SEO Agentur Allgäu, Festpreis Webdesign, Webdesign Bayern",
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
    canonical: 'https://webwelle.com',
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
  openGraph: {
    title: "Webdesign Kempten (Allgäu) | WebWelle – Websites, die Kunden gewinnen",
    description: "Professionelles Webdesign mit SEO, Performance & Festpreis. WebWelle – Ihre Agentur aus Kempten für digitalen Erfolg.",
    type: "website",
    locale: "de_DE",
    url: "https://webwelle.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" data-scroll-behavior="smooth" className="dark">
      <head>
        {/* Preload critical resources - nur einmal */}
        <link rel="preload" href="/webwellelogo.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/webwellecom-weissihr.svg" as="image" type="image/svg+xml" />
        {/* DNS prefetch und preconnect für externe Ressourcen - optimiert für kritische Ressourcen */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Stripe nur prefetch, nicht preconnect (nicht kritisch für initial load) */}
        <link rel="dns-prefetch" href="//js.stripe.com" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
