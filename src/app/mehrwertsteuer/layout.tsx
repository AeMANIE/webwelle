import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mehrwertsteuer-Rechner | WebWelle",
  description: "Einfach Brutto, Netto und Mehrwertsteuer berechnen. Kostenloser MwSt-Rechner mit 19% und 7% Steuersatz.",
  keywords: "Mehrwertsteuer, MwSt, Brutto, Netto, Steuerrechner, 19%, 7%, Umsatzsteuer",
};

export default function MehrwertsteuerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
