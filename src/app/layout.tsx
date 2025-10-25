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
    <html lang="de" data-scroll-behavior="smooth">
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/webwellelogo.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/webwellecom-weissihr.svg" as="image" type="image/svg+xml" />
        {/* DNS prefetch und preconnect für externe Ressourcen */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//js.stripe.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://js.stripe.com" />
        {/* Resource hints für bessere Performance */}
        <link rel="preload" href="/webwellelogo.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/webwellecom-weissihr.svg" as="image" type="image/svg+xml" />
        {/* Critical CSS inline für bessere Performance - verhindert Render-blocking */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical above-the-fold styles - Header und Hero */
            * { box-sizing: border-box; }
            body { margin: 0; font-family: var(--font-inter), system-ui, -apple-system, sans-serif; background: #0e141f; color: #ffffff; line-height: 1.6; }
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
            .font-bold { font-weight: 700; }
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
            .min-h-screen { min-height: 100vh; }
            .relative { position: relative; }
            .absolute { position: absolute; }
            .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
            .w-full { width: 100%; }
            .h-full { height: 100%; }
            .object-cover { object-fit: cover; }
            .text-center { text-align: center; }
            .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
            .text-5xl { font-size: 3rem; line-height: 1; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-8 { margin-bottom: 2rem; }
            .py-16 { padding-top: 4rem; padding-bottom: 4rem; }
            .py-32 { padding-top: 8rem; padding-bottom: 8rem; }
            .overflow-hidden { overflow: hidden; }
            @media (min-width: 640px) {
              .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
            }
            @media (min-width: 768px) {
              .md\\:flex { display: flex; }
              .md\\:hidden { display: none; }
              .md\\:py-32 { padding-top: 8rem; padding-bottom: 8rem; }
            }
            @media (min-width: 1024px) {
              .lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
            }
          `
        }} />
        {/* CSS wird normal über Next.js geladen - keine asynchronen Scripts */}
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
