'use client';

import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Wie läuft die Bezahlung ab?",
      answer: "Sie können zwischen Einmalzahlung oder fester Monatsrate (24 Monate, mit 20% Aufschlag) wählen. Die Zahlung erfolgt bequem per Online-Checkout mit verschiedenen Zahlungsmethoden wie Kreditkarte, PayPal oder SEPA-Lastschrift."
    },
    {
      question: "Was ist im Preis enthalten?",
      answer: "Alle Pakete beinhalten Domain, Hosting, Support und die im Angebot genannten Leistungen. Zusatzwünsche und digitale Automatisierungen berechnen wir fair und transparent dazu. Keine versteckten Kosten oder Überraschungen."
    },
    {
      question: "Wie unterscheidet sich die Next.js-Website von der WordPress-Lösung?",
      answer: "Die React/Next.js-Version ist extrem schnell, zukunftssicher und vollständig individualisierbar. Sie bietet beste Performance und ist ideal für anspruchsvolle Projekte. Die WordPress-Lösung ist günstiger bei Standard-Projekten und für klassische Webseiten mit einfacher Bedienung geeignet."
    },
    {
      question: "Kann ich später Funktionen hinzufügen?",
      answer: "Ja, Sie können Ihre Seite jederzeit durch Zusatzfunktionen, Automatisierung oder KI-Lösungen erweitern. Wir beraten Sie gerne zu den Möglichkeiten und erstellen ein individuelles Angebot für Erweiterungen."
    },
    {
      question: "Wie lange dauert die Entwicklung einer Website?",
      answer: "Die Entwicklungszeit hängt von der Komplexität ab. Eine WordPress-Website ist meist in 2-4 Wochen fertig, eine Next.js-Website in 4-8 Wochen. Wir halten Sie über den Fortschritt auf dem Laufenden und können bei Bedarf auch schneller liefern."
    },
    {
      question: "Bieten Sie auch Wartung und Support an?",
      answer: "Ja, alle unsere Pakete beinhalten Hosting, Wartung und Support. Wir sorgen für regelmäßige Updates, Backups und sind bei Fragen oder Problemen für Sie da. Zusätzliche Support-Pakete sind ebenfalls verfügbar."
    },
    {
      question: "Was passiert nach den 24 Monaten?",
      answer: "Nach 24 Monaten können Sie zwischen verschiedenen Optionen wählen: Weiterführung des Hosting- und Support-Services, Upgrade auf ein neues Paket oder Übernahme der Website. Wir beraten Sie gerne zu den besten Optionen für Ihr Unternehmen."
    },
    {
      question: "Arbeiten Sie auch mit Unternehmen außerhalb des Allgäus?",
      answer: "Ja, wir arbeiten bundesweit und auch international. Die meisten unserer Projekte werden remote abgewickelt, sodass der Standort keine Rolle spielt. Persönliche Treffen sind nach Absprache möglich."
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
            Häufige Fragen
          </h2>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            Hier finden Sie Antworten auf die wichtigsten Fragen zu unseren Services und dem Ablauf.
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

