'use client';

import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Was macht eine professionelle Website heute aus?',
      answer:
        'Eine professionelle Website wirkt vertrauenswürdig, ist klar aufgebaut und führt Besucher ohne Umwege zu den wichtigsten Informationen. Dazu kommen verständliche Inhalte, ein starker erster Eindruck und eine saubere Ausrichtung auf Anfragen.',
    },
    {
      question:
        'Warum ist Webdesign in Kempten und im Allgäu für lokale Unternehmen besonders wichtig?',
      answer:
        'Viele Kunden suchen gezielt nach Anbietern in ihrer Region. Wenn Ihre Website regional klar positioniert ist, verbessert das Ihre Sichtbarkeit und stärkt gleichzeitig das Vertrauen potenzieller Kunden.',
    },
    {
      question:
        'Kann ich meine Homepage erstellen lassen und gleichzeitig bei Google besser gefunden werden?',
      answer:
        'Ja, genau darauf sollte eine gute Website vorbereitet sein. Eine klare Seitenstruktur, passende Inhalte und eine solide lokale SEO-Basis schaffen dafür die richtige Grundlage.',
    },
    {
      question: 'Für wen ist das Angebot von WebWelle geeignet?',
      answer:
        'Das Angebot richtet sich an Selbstständige, lokale Dienstleister sowie kleine und mittlere Unternehmen, die professioneller auftreten und mehr Anfragen über ihre Website gewinnen möchten.',
    },
    {
      question: 'Wie läuft die Zusammenarbeit ab?',
      answer:
        'Die Zusammenarbeit ist persönlich, transparent und klar strukturiert. Sie wissen jederzeit, was als Nächstes passiert, welche Leistungen enthalten sind und wie die Umsetzung abläuft.',
    },
    {
      question: 'Gibt es feste Preise?',
      answer:
        'Ja, je nach Umfang arbeiten wir mit klaren und transparenten Preisen. So bleibt Ihr Projekt kalkulierbar und Sie erhalten von Anfang an eine verlässliche Orientierung.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            FAQ
          </h2>
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
                  <p className="text-muted-foreground leading-relaxed font-light">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
