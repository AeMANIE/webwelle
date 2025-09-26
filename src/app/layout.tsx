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
  description: "Webdesign, das Kunden gewinnt – mit garantierter Performance und festen Preisen. React/Next.js und WordPress Websites ab 1.290€. Individuell. Transparent. Modern.",
  keywords: "Webdesign, Festpreis, Next.js, WordPress, E-Commerce, SEO, Performance, Allgäu, Kempten",
  authors: [{ name: "WebWelle" }],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
  openGraph: {
    title: "WebWelle – Ihre Erfolgswelle",
    description: "Festpreis-Webdesign, das messbar wirkt. Individuell. Transparent. Modern.",
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
    <html lang="de">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
