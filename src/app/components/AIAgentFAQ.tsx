'use client';

import { useState } from 'react';

export default function AIAgentFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Was ist ein KI-Agent von WebWelle?",
      answer: "Ein KI-Agent von WebWelle ist ein digitaler Assistent, der wiederkehrende Aufgaben in Ihrem Unternehmen automatisiert – zum Beispiel Kundenanfragen beantworten, E-Mails verarbeiten oder Termine koordinieren. So sparen Sie Zeit und erhöhen Ihre Effizienz."
    },
    {
      question: "Für wen eignen sich WebWelle KI-Agenten?",
      answer: "Unsere KI-Agenten sind ideal für Selbstständige, Dienstleister und Unternehmen, die Zeit sparen und ihren Kundenservice automatisieren möchten. Besonders KMU profitieren von standardisierten Workflows und smarter Prozessoptimierung."
    },
    {
      question: "Wie erfolgt die Integration in bestehende Systeme?",
      answer: "Unsere Lösungen integrieren sich nahtlos in Ihre bestehenden Tools wie CRM-, Buchhaltungs- oder E-Mail-Systeme. Dank moderner API-Schnittstellen ist die Implementierung einfach und sicher – vollständig DSGVO-konform."
    },
    {
      question: "Welche Kosten entstehen für einen KI-Agenten?",
      answer: "Wir bieten drei transparente Festpreis-Pakete ab 99 € monatlich an. Jedes Paket umfasst Einrichtung, Anpassung und Support – ohne versteckte Gebühren."
    },
    {
      question: "Wie kann ich prüfen, ob ein KI-Agent für mein Unternehmen sinnvoll ist?",
      answer: "In einem kostenlosen Beratungsgespräch analysieren wir gemeinsam Ihre Abläufe und zeigen, welche Prozesse automatisiert werden können, um maximale Effizienz zu erzielen."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-12 sm:py-16 md:py-20 bg-background relative z-30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Häufige Fragen zu unseren KI-Agenten
          </h2>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            Hier finden Sie Antworten auf die wichtigsten Fragen zu unseren KI-Agenten und Automatisierungslösungen.
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
