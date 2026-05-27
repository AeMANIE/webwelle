'use client';

import { useState } from 'react';
import { MessageSquare, Mail, Calendar, TrendingUp, CheckCircle, ArrowRight, Zap, Clock, Users } from 'lucide-react';

export default function AIAgentDemo() {
  const [selectedDemo, setSelectedDemo] = useState<'flow' | 'power' | 'meister' | null>(null);

  const demos = {
    flow: {
      title: "FlowWelle Workflow",
      subtitle: "Der smarte Standard-Workflow",
      steps: [
        { 
          icon: MessageSquare, 
          title: "Anfrage eintrifft",
          description: "Kunde sendet Anfrage über Kontaktformular, E-Mail oder Chat"
        },
        { 
          icon: Zap, 
          title: "KI analysiert",
          description: "Agent erkennt Intention, sammelt Kontext, qualifiziert Lead"
        },
        { 
          icon: Mail, 
          title: "Antwort vorbereitet",
          description: "Personalisierte Antwort wird erstellt (markengerecht, professionell)"
        },
        { 
          icon: Calendar, 
          title: "Termin angeboten",
          description: "Verfügbare Termine werden automatisch vorgeschlagen"
        },
        { 
          icon: CheckCircle, 
          title: "Bestätigung gesendet",
          description: "Kunde bestätigt, Termin wird in Ihr System übertragen"
        }
      ],
      results: [
        { icon: Clock, label: "Antwortzeit", value: "24/7" },
        { icon: TrendingUp, label: "Lead-Qualität", value: "+85%" },
        { icon: Users, label: "Mehr Buchungen", value: "+120%" }
      ]
    },
    power: {
      title: "PowerWelle Workflow",
      subtitle: "Mehrstufige Automatisierung für wachsende Unternehmen",
      steps: [
        { 
          icon: MessageSquare, 
          title: "Multi-Channel-Input",
          description: "Anfragen aus Email, Chat, Social Media, Website werden gesammelt"
        },
        { 
          icon: Users, 
          title: "Intelligente Analyse",
          description: "KI erkennt Kundengruppe, Priorität, Urgenz und Context"
        },
        { 
          icon: Zap, 
          title: "Personalisierte Kommunikation",
          description: "Agent erstellt maßgeschneiderte Antworten basierend auf Unternehmen & Historie"
        },
        { 
          icon: Calendar, 
          title: "Termin-Vorschlag",
          description: "Mehrere Terminoptionen werden angeboten, Kalender-Integration"
        },
        { 
          icon: Mail, 
          title: "CRM-Update",
          description: "Lead wird automatisch in CRM eintragen, Klassifizierung erfolgt"
        },
        { 
          icon: CheckCircle, 
          title: "Follow-up & Tracking",
          description: "Automatische Erinnerungen, Status-Tracking, Performance-Analyse"
        }
      ],
      results: [
        { icon: Clock, label: "Multi-Channel", value: "4 Kanäle" },
        { icon: TrendingUp, label: "Konversion", value: "+150%" },
        { icon: Users, label: "ROI-Erhöhung", value: "300%+" }
      ]
    },
    meister: {
      title: "MeisterWelle Workflow",
      subtitle: "Premium-Automatisierung für echte Marktführer",
      steps: [
        { 
          icon: MessageSquare, 
          title: "Omni-Channel-Sammelstelle",
          description: "Alle Kanäle (Website, Email, Chat, Social, Telefon) werden zentral verarbeitet"
        },
        { 
          icon: Users, 
          title: "Deep-Learning Analyse",
          description: "Vollständige Kundensegmentierung, Intent-Mapping, Predictive Modelling"
        },
        { 
          icon: Zap, 
          title: "Hyper-Personalisiert",
          description: "Einzigartige Kommunikation basierend auf Historie, Präferenzen, Verhalten"
        },
        { 
          icon: Calendar, 
          title: "Intelligente Terminoptimierung",
          description: "KI wählt optimale Zeitfenster, automatische Kalender-Resynchronisierung"
        },
        { 
          icon: Mail, 
          title: "Seamless System-Integration",
          description: "Multi-CRM, Buchhaltung, ERP, Projektmanagement - alles verbunden"
        },
        { 
          icon: TrendingUp, 
          title: "Proaktive Empfehlungen",
          description: "Cross-Selling, Upselling, personalisierte Angebote basierend auf Interesse"
        },
        { 
          icon: CheckCircle, 
          title: "Kontinuierliche Optimierung",
          description: "A/B-Testing, Performance-Tracking, monatliche Strategie-Updates"
        }
      ],
      results: [
        { icon: Clock, label: "Alle Kanäle", value: "Unbegrenzt" },
        { icon: TrendingUp, label: "Conversion", value: "+250%" },
        { icon: Users, label: "Premium-ROI", value: "400%+" }
      ]
    }
  };

  const activeDemo = selectedDemo ? demos[selectedDemo] : null;

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 tracking-tight">
            So funktioniert Ihr KI-Agent
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            Wählen Sie ein Paket und erleben Sie den Automatisierungs-Workflow im Detail.
          </p>
        </div>

        {/* Demo Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          {(['flow', 'power', 'meister'] as const).map((demo) => (
            <button
              key={demo}
              onClick={() => setSelectedDemo(selectedDemo === demo ? null : demo)}
              className={`group relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300 ${
                selectedDemo === demo
                  ? 'border-primary bg-primary/10 shadow-xl'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${demo === 'flow' ? 'from-blue-500/5 to-blue-600/5' : demo === 'power' ? 'from-purple-500/5 to-purple-600/5' : 'from-orange-500/5 to-orange-600/5'}`} />
              
              <div className="relative z-10 text-left">
                <div className={`text-2xl font-bold mb-2 ${
                  selectedDemo === demo ? 'text-primary' : 'text-foreground'
                }`}>
                  {demo === 'flow' ? 'Flow' : demo === 'power' ? 'Power' : 'Meister'}Welle
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  {demo === 'flow' && 'Der smarte Einstieg'}
                  {demo === 'power' && 'Für wachsende Unternehmen'}
                  {demo === 'meister' && 'Premium für Marktführer'}
                </div>
                <div className="flex items-center text-primary font-semibold text-sm">
                  {selectedDemo === demo ? 'Ausgewählt' : 'Demos auswählen'}
                  <ArrowRight className={`w-4 h-4 ml-2 transition-transform ${selectedDemo === demo ? 'translate-x-1' : ''}`} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Demo Content */}
        {activeDemo && (
          <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            {/* Title */}
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {activeDemo.title}
              </h3>
              <p className="text-lg text-muted-foreground">
                {activeDemo.subtitle}
              </p>
            </div>

            {/* Workflow Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {activeDemo.steps.map((step, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-xl p-6 border-2 border-border hover:border-primary transition-colors relative group"
                >
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="mb-4">
                    <step.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  </div>

                  {/* Content */}
                  <h4 className="font-bold text-foreground text-lg mb-2">
                    {step.title}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>

                  {/* Arrow to next step (except last) */}
                  {index < activeDemo.steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-primary/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Results */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border-2 border-primary/20">
              <h4 className="text-xl font-bold text-foreground mb-6 text-center">
                Ihre Ergebnisse mit diesem Workflow
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeDemo.results.map((result, index) => (
                  <div key={index} className="bg-card rounded-xl p-6 text-center border border-border">
                    <result.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {result.value}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {result.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Default State */}
        {selectedDemo === null && (
          <div className="text-center py-20">
            <div className="bg-card rounded-2xl p-12 border-2 border-border max-w-3xl mx-auto">
              <Zap className="w-16 h-16 text-primary mx-auto mb-6 opacity-50" />
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Workflow-Demo auswählen
              </h3>
              <p className="text-muted-foreground mb-6">
                Wählen Sie eines der Pakete oben aus, um den detaillierten Automatisierungs-Workflow zu sehen.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setSelectedDemo('flow')}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                  FlowWelle Demo starten
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

