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
  title: "WebWelle – Ihre Erfolgswelle | Festpreis-Webdesign",
  description: "Professionelles Webdesign mit festen Preisen. StarterWelle ab 77€/Monat, BusinessWelle ab 139€/Monat, ErfolgsWelle ab 278€/Monat. Inkl. Domain, Hosting & Support. Individuell. Transparent.",
  keywords: "Webdesign, Festpreis, Next.js, WordPress, E-Commerce, SEO, Performance, Allgäu, Kempten",
  authors: [{ name: "WebWelle" }],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
  openGraph: {
    title: "WebWelle – Ihre Erfolgswelle",
    description: "WebWelle – Ihre Erfolgswelle für professionelle Websites zum Festpreis. Individuelles und modernes Webdesign, transparente Preise, blitzschneller Start und jederzeit flexibel erweiterbar. Maximale Geschwindigkeit, klare Kommunikation und messbare Ergebnisse für Ihr Business.",
    type: "website",
    locale: "de_DE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" data-scroll-behavior="smooth">
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/webwellelogo.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/webwellecom-weissihr.svg" as="image" type="image/svg+xml" />
        {/* DNS prefetch für externe Ressourcen */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//js.stripe.com" />
        {/* Critical CSS inline für bessere Performance */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical above-the-fold styles */
            * { box-sizing: border-box; }
            body { margin: 0; font-family: var(--font-inter), system-ui, -apple-system, sans-serif; background: #0e141f; color: #ffffff; }
            .bg-background { background-color: #0e141f; }
            .text-foreground { color: #ffffff; }
            .text-primary { color: #DCA441; }
            .bg-primary { background-color: #DCA441; }
            .text-primary-foreground { color: #0e141f; }
            .border-border { border-color: #374151; }
            .bg-card { background-color: #1a2332; }
            .text-muted-foreground { color: #a0a0a0; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .sticky { position: sticky; }
            .top-0 { top: 0; }
            .z-50 { z-index: 50; }
            .backdrop-blur-sm { backdrop-filter: blur(4px); }
            .border-b { border-bottom-width: 1px; }
            .hidden { display: none; }
            .transition-colors { transition: color 150ms, background-color 150ms, border-color 150ms; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .rounded-lg { border-radius: 0.5rem; }
            .h-6 { height: 1.5rem; }
            .w-6 { width: 1.5rem; }
            .h-12 { height: 3rem; }
            .w-auto { width: auto; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
            .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .max-w-7xl { max-width: 80rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .space-x-1 > * + * { margin-left: 0.25rem; }
            .space-x-8 > * + * { margin-left: 2rem; }
            .hover\\:text-primary:hover { color: #DCA441; }
            .hover\\:bg-primary\\/90:hover { background-color: rgba(220, 164, 65, 0.9); }
            .focus\\:outline-none:focus { outline: 2px solid transparent; }
            .focus\\:text-primary:focus { color: #DCA441; }
            @media (min-width: 640px) {
              .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
            }
            @media (min-width: 768px) {
              .md\\:flex { display: flex; }
              .md\\:hidden { display: none; }
            }
            @media (min-width: 1024px) {
              .lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
            }
          `
        }} />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
