'use client';

import { Star, Quote } from 'lucide-react';

export default function AIAgentTestimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Michael Schmidt",
      role: "Geschäftsführer",
      company: "Schmidt Elektrotechnik GmbH",
      location: "Kempten, Allgäu",
      content: "Unser FlowWelle KI-Agent beantwortet täglich bis zu 30 Anfragen automatisch. Wir sparen so mindestens 3 Stunden pro Tag und konvertieren deutlich mehr Leads.",
      rating: 5,
      results: {
        leads: "+180%",
        response: "24/7",
        saved: "15h/Woche"
      }
    },
    {
      id: 2,
      name: "Sarah Weber",
      role: "Inhaberin",
      company: "Weber Wellness",
      location: "Immenstadt",
      content: "Die Terminbuchung läuft jetzt vollautomatisch über unseren KI-Agent. Keine verpassten Anfragen mehr, perfekte Terminplanung und unsere Kunden sind begeistert vom schnellen Service.",
      rating: 5,
      results: {
        bookings: "+95%",
        response: "Sofort",
        saved: "10h/Woche"
      }
    },
    {
      id: 3,
      name: "Thomas Müller",
      role: "CEO",
      company: "Müller Consulting",
      location: "Oberstdorf",
      content: "Mit der MeisterWelle-Lösung haben wir unsere Kundenkommunikation revolutioniert. Der Agent versteht Kontext, gibt personalisierte Auskünfte und leitet komplexe Anfragen perfekt weiter.",
      rating: 5,
      results: {
        satisfaction: "98%",
        response: "Kontext-gesteuert",
        saved: "20h/Woche"
      }
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-primary/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 tracking-tight">
            Vertrauen Sie den Erfahrungen unserer Kunden
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            KMU aus dem Allgäu automatisieren erfolgreich ihre Kundenkommunikation mit unseren KI-Agenten.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-card rounded-2xl p-8 border-2 border-border hover:shadow-xl transition-all duration-300 relative group"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-16 h-16 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="w-5 h-5 fill-primary text-primary" 
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground leading-relaxed mb-8 relative z-10 font-light italic">
                "{testimonial.content}"
              </p>

              {/* Results */}
              <div className="mb-6 space-y-3 pb-6 border-b border-border">
                {Object.entries(testimonial.results).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key === 'response' ? 'Antwortzeit:' : 
                       key === 'bookings' ? 'Buchungen:' :
                       key === 'leads' ? 'Mehr Leads:' :
                       key === 'saved' ? 'Zeitersparnis:' :
                       key === 'satisfaction' ? 'Zufriedenheit:' : key}
                    </span>
                    <span className="font-semibold text-primary">{value}</span>
                  </div>
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-sm text-primary font-medium">
                    {testimonial.company}
                  </p>
                  <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-foreground mb-3">
              Werden auch Sie zum Erfolgs-Kunde!
            </h3>
            <p className="text-muted-foreground mb-6">
              Lassen Sie sich in einem kostenlosen Gespräch zeigen, wie ein KI-Agent Ihr Business revolutionieren kann.
            </p>
            <a
              href="#cta"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Kostenloses Beratungsgespräch vereinbaren
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

