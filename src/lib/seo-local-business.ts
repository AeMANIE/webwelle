import { BASE_URL } from '@/lib/seo-index';

export function getHomepageJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'WebWelle by AeManie GmbH',
        legalName: 'AeManie GmbH',
        url: BASE_URL,
        email: 'info@webwelle.com',
        telephone: '+49-172-9525182',
        logo: `${BASE_URL}/logo.png`,
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${BASE_URL}/#localbusiness`,
        name: 'WebWelle by AeManie GmbH',
        description:
          'Professionelles Webdesign in Kempten und Allgäu. Festpreis-Websites für Selbstständige und Unternehmen. Beratung per Zoom nach Vereinbarung.',
        url: BASE_URL,
        parentOrganization: { '@id': `${BASE_URL}/#organization` },
        email: 'info@webwelle.com',
        telephone: '+49-172-9525182',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Uhlandstraße 16',
          postalCode: '87437',
          addressLocality: 'Kempten',
          addressRegion: 'Bayern',
          addressCountry: 'DE',
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
            opens: '09:30',
            closes: '16:30',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Friday',
            opens: '09:30',
            closes: '12:30',
          },
        ],
        areaServed: [
          { '@type': 'City', name: 'Kempten' },
          { '@type': 'AdministrativeArea', name: 'Allgäu' },
          { '@type': 'State', name: 'Bayern' },
          { '@type': 'Country', name: 'Deutschland' },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: 'WebWelle',
        publisher: { '@id': `${BASE_URL}/#organization` },
      },
    ],
  };
}
