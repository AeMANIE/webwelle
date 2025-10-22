import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/customer/',
        '/_next/',
        '/success',
        '/verify-email',
        '/reset-password',
        '/forgot-password',
      ],
    },
    sitemap: 'https://webwelle.com/sitemap.xml',
  }
}
