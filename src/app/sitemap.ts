import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://webwelle.com'
  const now = new Date()
  
  return [
    // Hauptseite
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    // App-Entwicklung (neue Seite)
    {
      url: `${baseUrl}/app-entwicklung`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Hauptsektionen (Anker-Links entfernt - verursachen Duplikate)
    // Tools und Services
    {
      url: `${baseUrl}/mehrwertsteuer`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // KI-Agenten
    {
      url: `${baseUrl}/ai-agent`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Blog
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Buchungsseiten - Website Pakete
    {
      url: `${baseUrl}/buchung/starterwelle`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/buchung/businesswelle`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/buchung/erfolgswelle`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Buchungsseiten - KI-Agent Pakete
    {
      url: `${baseUrl}/buchung/flowwelle`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/buchung/powerwelle`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/buchung/meisterwelle`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Kundenbereich
    {
      url: `${baseUrl}/customer`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/customer/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Registrierung und Authentifizierung
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/forgot-password`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/reset-password`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/verify-email`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Admin-Bereich
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/admin/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    // Erfolgsseiten
    {
      url: `${baseUrl}/success`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Rechtliche Seiten
    {
      url: `${baseUrl}/impressum`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/datenschutz`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/agb`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/widerruf`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}

