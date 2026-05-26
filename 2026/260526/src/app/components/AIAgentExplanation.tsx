'use client';

import { Zap, Clock, Users, Shield, Sparkles } from 'lucide-react';

export default function AIAgentExplanation() {
  const features = [
    {
      icon: Zap,
      text: "Empfängt Anfragen automatisch und reagiert innerhalb von Sekunden"
    },
    {
      icon: Sparkles,
      text: "Erkennt wiederkehrende Muster und lernt eigenständig hinzu"
    },
    {
      icon: Clock,
      text: "Spart bis zu 7 Stunden täglich an administrativen Aufgaben"
    },
    {
      icon: Users,
      text: "Integration in bestehende Systeme wie CRM, Buchhaltung oder WhatsApp"
    },
    {
      icon: Shield,
      text: "Ihre Marke bleibt aktiv, auch wenn Sie offline sind"
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Verstehen Sie die Technologie
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 tracking-tight">
              Was ist ein WebWelle KI-Agent?
            </h2>
            
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed font-light">
              Ein <strong className="text-foreground font-semibold">KI-Agent</strong> ist ein digitaler Assistent, 
              der repetitive Arbeitsabläufe in Ihrem Unternehmen automatisiert: von Anfrage-Management und 
              E-Mail-Kommunikation über Terminbuchung bis hin zu Angebotsversand und Lead-Qualifizierung.
            </p>
            
            <p className="text-lg text-foreground mb-8 font-medium">
              So bleibt mehr Zeit für das Wesentliche – Ihre Kunden und Ihr Wachstum.
            </p>

            {/* Features List */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-foreground leading-relaxed pt-3">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Visual Benefits */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 md:p-12 border-2 border-primary/20">
            <h3 className="text-2xl font-bold text-foreground mb-6">
              Ihre Vorteile mit KI-Automatisierung
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Kundenservice 24/7</h4>
                  <p className="text-muted-foreground">
                    Ihr KI-Agent beantwortet Fragen sofort – auch außerhalb der Bürozeiten.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Mehr Umsatz, weniger Aufwand</h4>
                  <p className="text-muted-foreground">
                    Automatisierung steigert Effizienz und senkt Personalkosten.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Intelligente Zeitnutzung</h4>
                  <p className="text-muted-foreground">
                    Mitarbeiter konzentrieren sich auf strategische Aufgaben statt Routine.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Lernfähige Technologie</h4>
                  <p className="text-muted-foreground">
                    Ihr System wird mit jeder Interaktion smarter.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Rechtssicherheit & Datenschutz</h4>
                  <p className="text-muted-foreground">
                    Garantiert DSGVO-konform – Hosting ausschließlich in Deutschland.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

