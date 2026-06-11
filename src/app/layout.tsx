import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import UmamiAnalytics from "./components/UmamiAnalytics";
import { getUmamiConfig } from "@/lib/umami";

const umamiConfig = getUmamiConfig();

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://webwelle.com'),
  title: "Webdesign Kempten (Allgäu) | WebWelle – Professionelle Websites für mehr Anfragen",
  description:
    "WebWelle entwickelt professionelle Websites für Selbstständige und Unternehmen im Allgäu – klar aufgebaut, auf Vertrauen ausgerichtet, für mehr Anfragen.",
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
    title: "Webdesign Kempten (Allgäu) | WebWelle – Professionelle Websites für mehr Anfragen",
    description:
      "WebWelle entwickelt professionelle Websites für Selbstständige und Unternehmen im Allgäu – klar aufgebaut, auf Vertrauen ausgerichtet, für mehr Anfragen.",
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
        {/* Stripe nur prefetch, nicht preconnect (nicht kritisch für initial load) */}
        <link rel="dns-prefetch" href="//js.stripe.com" />
        {umamiConfig && (
          <>
            <link rel="dns-prefetch" href={umamiConfig.origin} />
            <link rel="preconnect" href={umamiConfig.origin} crossOrigin="anonymous" />
          </>
        )}
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <UmamiAnalytics />
        {children}
      </body>
    </html>
  );
}
