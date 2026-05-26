'use client';

import { useState } from 'react';

export default function AIVoiceFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Wie sicher sind meine Daten?",
      answer: "Alle Anrufe und Ihre Daten werden DSGVO-konform ausschließlich in der EU gespeichert und verarbeitet."
    },
    {
      question: "Wie funktioniert die Integration?",
      answer: "Ihr KI-Assistent ist nach Aktivierung sofort einsatzbereit. Systeme wie Kalender, CRM, E-Mail können angebunden werden – keine IT-Kenntnisse nötig."
    },
    {
      question: "Kann der AI-Assistent aktiv Aufgaben erledigen?",
      answer: "Ja. Ihr Voice-AI kann sowohl Anrufe entgegennehmen als auch selbsttätig durchführen und dabei Aufgaben wie Terminvereinbarung, Angebotsabfragen, Nachfassaktionen abwickeln."
    },
    {
      question: "Wie werden Minuten abgerechnet?",
      answer: "Sie wählen Ihr Minutenpaket passend zum Bedarf. Jede Gesprächsminute zählt, weitere Minuten können nach Bedarf gebucht werden."
    },
    {
      question: "Gibt es eine Supportnummer?",
      answer: "Für alle Fragen steht unser Team direkt zur Verfügung."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 bg-card">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-foreground text-center mb-12">
          FAQ Voice-AI Assistent
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-background rounded-lg overflow-hidden border border-border">
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
      </div>
    </section>
  );
}

