export interface OutboundProduct {
  id: string;
  name: string;
  priceLabel: string;
  benefit: string;
}

export const OUTBOUND_PRODUCTS: OutboundProduct[] = [
  { id: 'starterwelle', name: 'StarterWelle', priceLabel: '699 € netto / 24 Monate', benefit: 'Professioneller React-Auftritt ohne Baukasten-Kompromisse – planbar und klar kalkuliert.' },
  { id: 'dwa', name: 'Digitale Wachstumsarchitektur', priceLabel: 'individuelles Angebot', benefit: 'Für Unternehmen, die über eine Onepage hinaus Funnels, Portale und Automatisierung brauchen.' },
  { id: 'executive_ki', name: 'Executive KI-Systeme', priceLabel: 'individuelles Angebot', benefit: 'KI-gestützte Vorbereitung von Kommunikation, Angeboten und Entscheidungsunterlagen auf C-Level.' },
  { id: 'seo_profi', name: 'SEO Profi Zusatzpaket', priceLabel: '299 € netto', benefit: 'Keyword-Strategie, OnPage-Optimierung und laufendes Monitoring für mehr Google-Sichtbarkeit.' },
  { id: 'blog_bundle_10', name: '10 Blog-Artikel Paket', priceLabel: '499 € netto', benefit: 'SEO-optimierte Fachartikel für dauerhaft mehr organischen Traffic.' },
  { id: 'gmb_komplett', name: 'Google My Business Komplettservice', priceLabel: '499 € netto einmalig', benefit: '3 KI-Fotos, 3 optimierte Google-Posts, Produkte einpflegen, Buchungen aktivieren.' },
  { id: 'branding', name: 'Branding & Logo', priceLabel: '199 € netto', benefit: '4 Logo-Entwürfe zur Auswahl für einen professionellen ersten Eindruck.' },
  { id: 'animation', name: 'Animationspaket', priceLabel: '999 € netto', benefit: 'Scroll-Animationen und Übergänge für mehr Wirkung ohne Ladezeit-Einbußen.' },
];

export function productById(id: string): OutboundProduct | null {
  return OUTBOUND_PRODUCTS.find((p) => p.id === id) || null;
}
