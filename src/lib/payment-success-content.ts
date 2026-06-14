export const ZOOM_SCHEDULER_URL =
  process.env.NEXT_PUBLIC_ZOOM_SCHEDULER_URL ??
  'https://scheduler.zoom.us/aemanie-gmbh/30-minuten-mit-aemanie-gmbh-herr-manie';

export const ZOOM_MEETING_ID = '927 335 0202';

export const PAYMENT_SUCCESS_CONTENT = {
  headline: 'Zahlung erfolgreich abgeschlossen',
  intro:
    'Ihre Bestellung wurde erfolgreich übermittelt und Ihr Projekt kann nun starten.',
  ctaTitle: 'Nächster Schritt: Wählen Sie jetzt Ihren Wunschtermin aus.',
  ctaDescription:
    'So können wir die nächsten Schritte für Ihr Projekt direkt abstimmen und ohne Verzögerung starten.',
  ctaButton: 'Wunschtermin auswählen',
  emailNote:
    'Nach der Buchung erhalten Sie Ihre Bestätigung per E-Mail mit allen weiteren Informationen.',
  stepsTitle: 'So geht es jetzt weiter',
  steps: [
    {
      title: 'Termin auswählen',
      description:
        'Wählen Sie jetzt einen freien Termin aus, der für Sie am besten passt.',
    },
    {
      title: 'Details abstimmen',
      description:
        'Im Termin besprechen wir die wichtigsten Punkte für Ihr Projekt, Ihre Wünsche und den weiteren Ablauf.',
    },
    {
      title: 'Projektstart',
      description:
        'Anschließend beginnen wir mit der Vorbereitung und Umsetzung auf Basis Ihrer Auswahl und der abgestimmten Inhalte.',
    },
  ],
  supportEmail: 'info@webwelle.com',
  homeLink: 'Zurück zur Startseite',
} as const;
