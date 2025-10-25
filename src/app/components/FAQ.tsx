'use client';

import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Was kostet eine professionelle Website bei WebWelle?",
      answer: "Unsere Webdesign-Pakete starten ab 77 € monatlich oder 1.499 € jährlich (mit Ersparnis). Sie haben die Wahl zwischen monatlicher oder jährlicher Zahlung – beide Optionen beinhalten volle Kostentransparenz mit Festpreisen. Unsere drei Pakete: StarterWelle (ab 77 € mtl.), BusinessWelle (ab 139 € mtl.), ErfolgsWelle (ab 278 € mtl.). Alle Pakete inkludieren Hosting, Domain, E-Mail-Postfach, technische Wartung und regelmäßige Backups – ohne versteckte Kosten."
    },
    {
      question: "Wie lange dauert die Entwicklung meiner Website?",
      answer: "Die Entwicklungszeit hängt vom gewählten Paket ab: StarterWelle (Onepage): 2–3 Wochen, BusinessWelle: 3–4 Wochen, ErfolgsWelle: 4–6 Wochen. Mit unserer Blitz-Welle-Option schalten wir Ihre Website in nur 2 Wochen live – perfekt für zeitkritische Kampagnen oder kurzfristige Projekte. Alle Projekte durchlaufen dabei unseren bewährten Qualitätsprozess: Analyse, individuelles Design, Entwicklung und Testing."
    },
    {
      question: "Nutzt WebWelle Baukasten-Systeme wie WordPress oder Wix?",
      answer: "Nein! Unsere Webseiten sind 100% individuell programmiert – keine Standard-Baukästen, sondern hochwertige Lösungen mit React-Technologie und höchster Performance. Ihre Vorteile: Blitzschnelle Ladezeiten (Google PageSpeed 90+), maximale Flexibilität für individuelle Funktionen, skalierbar und zukunftssicher, keine Limitierungen durch Baukasten-Vorlagen, optimal für SEO und moderne Webtechnologien. Mit React entwickeln wir Websites, die nicht nur gut aussehen, sondern auch technisch auf höchstem Niveau arbeiten."
    },
    {
      question: "Sind die Websites für Suchmaschinen (SEO) optimiert?",
      answer: "Ja! Alle unsere Websites sind grundlegend SEO-optimiert. Dank React und moderner Webtechnologien erreichen wir beste Google Core Web Vitals und schnelle Ladezeiten. Das BusinessWelle-Paket enthält eine SEO-freundliche Grundoptimierung, während das ErfolgsWelle-Paket eine vollständige SEO-Strategie (OnPage & OffPage) mit monatlicher Performance-Auswertung und kontinuierlicher Optimierung beinhaltet."
    },
    {
      question: "Kann ich meine Website später erweitern oder anpassen?",
      answer: "Selbstverständlich! Alle Pakete sind jederzeit individuell erweiterbar. Da wir mit React entwickeln, können wir problemlos neue Funktionen integrieren. Mögliche Erweiterungen: Online-Shops, Terminbuchungssysteme, KI-Agenten, Mitgliederbereiche, Lieferdienst-Integration, Bildergalerien und vieles mehr. Wir beraten Sie gerne zu den Möglichkeiten und Kosten."
    },
    {
      question: "Was passiert nach den 24 Monaten Vertragslaufzeit?",
      answer: "Nach Ablauf der 24 Monate haben Sie drei flexible Optionen: Vertrag zu reduzierten Konditionen verlängern (nur Hosting & Wartung), Website komplett übernehmen , neuen Vertrag mit Modernisierung und Updates abschließen. Ihre Website bleibt in jedem Fall funktionsfähig – Sie behalten die volle Kontrolle über Ihre digitale Präsenz."
    },
    {
      question: "Arbeitet WebWelle nur im Allgäu oder auch bundesweit?",
      answer: "Wir sind lokal in Kempten (Allgäu) verwurzelt, arbeiten aber bundesweit. Dank moderner Kommunikationsmittel betreuen wir Kunden in ganz Deutschland – mit der gleichen persönlichen Betreuung wie vor Ort. Für lokale Kunden bieten wir natürlich auch persönliche Treffen in Kempten an."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Häufige Fragen zu WebWelle Webdesign
          </h2>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            Hier finden Sie Antworten auf die wichtigsten Fragen zu unseren Leistungen, Preisen und dem Ablauf Ihres Webprojekts.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-card rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-secondary/50 transition-colors"
              >
                <span className="font-semibold text-foreground pr-4 tracking-wide">
                  {faq.question}
                </span>
                <div className="flex-shrink-0">
                  <svg
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-4">
                <p className="text-muted-foreground leading-relaxed font-light">
                  {faq.answer}
                </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <div className="bg-primary/10 rounded-2xl p-6 sm:p-8 md:p-10 border border-primary/20">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">
              Haben Sie weitere Fragen?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-2 leading-relaxed">
              Wir beantworten gerne alle Ihre Fragen in einem kostenlosen Erstgespräch.
            </p>
            <a
              href="#cta"
              className="inline-block bg-primary text-primary-foreground px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm sm:text-base md:text-lg whitespace-nowrap"
            >
              Kostenloses Gespräch vereinbaren
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

