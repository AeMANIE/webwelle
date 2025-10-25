import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, User, ArrowLeft, Tag, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: "Blog Artikel | WebWelle – Webdesign Kempten (Allgäu)",
  description: "Detaillierte Webdesign- und SEO-Insights aus Kempten und dem Allgäu.",
};

// In einer echten Anwendung würde dies aus einer Datenbank kommen
const blogPost = {
  id: 1,
  title: "Top 5 Unternehmenswebsites im Allgäu – Was macht sie erfolgreich?",
  content: `
    <p>In diesem Artikel analysieren wir die erfolgreichsten Unternehmenswebsites in unserer Region. Von lokalen Handwerksbetrieben bis hin zu innovativen Start-ups – wir zeigen Ihnen, welche Elemente eine Website zum Erfolg führen.</p>
    
    <h2>Warum lokale Websites anders funktionieren</h2>
    <p>Das Allgäu hat seine eigenen Besonderheiten, wenn es um digitale Präsenz geht. Die Mischung aus traditionellen Handwerksbetrieben und modernen Unternehmen schafft eine einzigartige digitale Landschaft.</p>
    
    <h3>1. Lokale SEO-Optimierung</h3>
    <p>Die erfolgreichsten Websites in unserer Region haben eines gemeinsam: Sie sind perfekt für lokale Suchanfragen optimiert. Keywords wie "Webdesign Kempten", "Handwerker Allgäu" oder "Dienstleister Bayern" werden strategisch eingesetzt.</p>
    
    <h3>2. Authentische Regionalität</h3>
    <p>Allgäuer Unternehmen, die online erfolgreich sind, nutzen ihre regionale Identität als Stärke. Bilder der Allgäuer Landschaft, lokale Referenzen und regionale Sprache schaffen Vertrauen bei potenziellen Kunden.</p>
    
    <h3>3. Mobile-First Design</h3>
    <p>Da viele Suchanfragen mobil erfolgen, sind responsive Designs essentiell. Besonders in ländlichen Gebieten wie dem Allgäu ist die mobile Nutzung überdurchschnittlich hoch.</p>
    
    <h3>4. Klare Kontaktinformationen</h3>
    <p>Lokale Unternehmen müssen leicht erreichbar sein. Prominente Kontaktdaten, Google Maps Integration und lokale Telefonnummern sind unverzichtbar.</p>
    
    <h3>5. Vertrauensaufbau durch Testimonials</h3>
    <p>Kundenbewertungen und Referenzen von anderen Allgäuer Unternehmen schaffen Glaubwürdigkeit und Vertrauen.</p>
    
    <h2>Fazit</h2>
    <p>Eine erfolgreiche Website im Allgäu kombiniert lokale SEO-Strategien mit authentischer Regionalität. Die besten Beispiele zeigen, dass es nicht nur um technische Perfektion geht, sondern auch um die richtige Ansprache der lokalen Zielgruppe.</p>
    
    <p>Möchten Sie auch zu den erfolgreichsten Websites in Kempten gehören? Unser SEO-Team hilft Ihnen dabei, Ihre Online-Präsenz zu optimieren.</p>
  `,
  author: "SEO-Team WebWelle",
  date: "2025-01-15",
  readTime: "8 Min",
  tags: ["Lokales SEO", "Webdesign", "Allgäu", "Unternehmenswebsites"],
  featured: true
};

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Blog
          </Link>
          
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-primary font-semibold text-sm">Featured Artikel</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {blogPost.title}
          </h1>
          
          <div className="flex items-center gap-6 text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{blogPost.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(blogPost.date).toLocaleDateString('de-DE')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{blogPost.readTime} Lesezeit</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {blogPost.tags.map((tag, index) => (
              <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: blogPost.content }}
          />
        </div>
      </article>

      {/* Author Bio */}
      <section className="py-12 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-background rounded-2xl p-8 border border-border">
            <h3 className="text-2xl font-bold text-foreground mb-4">Über den Autor</h3>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                W
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">SEO-Team WebWelle</h4>
                <p className="text-muted-foreground mb-4">
                  Unser erfahrenes SEO-Team aus Kempten hilft Unternehmen im Allgäu dabei, 
                  online sichtbarer zu werden. Mit über 5 Jahren Erfahrung in lokaler SEO 
                  und Webdesign kennen wir die Besonderheiten unserer Region.
                </p>
                <div className="flex gap-4">
                  <Link 
                    href="/#cta"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Kontakt aufnehmen
                  </Link>
                  <Link 
                    href="/#produkte"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Webdesign-Pakete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Bereit für Ihre eigene Erfolgsstory?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Lassen Sie uns gemeinsam Ihre Website zu einer der erfolgreichsten im Allgäu machen.
          </p>
          <Link 
            href="/#cta"
            className="bg-primary-foreground text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground/90 transition-colors inline-block"
          >
            Kostenloses Erstgespräch vereinbaren
          </Link>
        </div>
      </section>
    </div>
  );
}
