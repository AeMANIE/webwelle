import { WW_EMAIL_LIGHT as L } from '../design-tokens';
import {
  emailButton,
  emailPanel,
  escapeHtml,
  renderWebWelleEmailShell,
} from './email-layout';

type PortalMailVariant = 'new_customer' | 'existing_unactivated' | 'existing_active' | 'resume';
type PortalMailKind = 'starterwelle' | 'wachstumsarchitektur';

interface PortalMailCopy {
  title: string;
  intro: string;
  cta: string;
  note: string;
  resumeLinkLabel: string;
  portalBullets: string[];
}

const PORTAL_MAIL_COPY: Record<PortalMailKind, Record<PortalMailVariant, PortalMailCopy>> = {
  starterwelle: {
    new_customer: {
      title: 'Ihr WebWelle Kundenportal ist bereit',
      intro:
        'richten Sie Ihr Kundenportal ein, vergeben Sie Ihr Passwort und öffnen Sie direkt Ihre Website-Analyse.',
      cta: 'Kundenportal einrichten & Analyse ansehen',
      note: 'Nach der Einrichtung landen Sie direkt im Analysebereich Ihres neuen Kundenportals.',
      resumeLinkLabel: 'Analyse später fortsetzen',
      portalBullets: [
        'Website-Analyse mit SEO-, Design- und Performance-Ergebnissen',
        'Ihre gespeicherten Lieblings-Webseiten und Empfehlungen',
        'Angebote, Buchungen und Rechnungen an einem Ort',
      ],
    },
    existing_unactivated: {
      title: 'Portal aktivieren und Analyse verbinden',
      intro:
        'wir haben Ihre neue Website-Analyse Ihrem bestehenden WebWelle-Konto zugeordnet. Aktivieren Sie jetzt den Portalzugang und vergeben Sie Ihr Passwort.',
      cta: 'Portal aktivieren & Analyse verbinden',
      note: 'Bestehende Buchungen und Rechnungen bleiben erhalten und werden mit dieser Analyse verbunden.',
      resumeLinkLabel: 'Analyse später fortsetzen',
      portalBullets: [
        'Website-Analyse mit SEO-, Design- und Performance-Ergebnissen',
        'Ihre gespeicherten Lieblings-Webseiten und Empfehlungen',
        'Angebote, Buchungen und Rechnungen an einem Ort',
      ],
    },
    existing_active: {
      title: 'Ihre neue Analyse ist im Kundenportal bereit',
      intro:
        'wir haben Ihre Website-Analyse mit Ihrem bestehenden Kundenportal verbunden. Melden Sie sich an, um die Ergebnisse anzusehen.',
      cta: 'Einloggen & Analyse ansehen',
      note: 'Ihr bestehendes Passwort bleibt unverändert. Falls Sie es vergessen haben, nutzen Sie bitte den Passwort-zurücksetzen-Link im Login.',
      resumeLinkLabel: 'Analyse später fortsetzen',
      portalBullets: [
        'Website-Analyse mit SEO-, Design- und Performance-Ergebnissen',
        'Ihre gespeicherten Lieblings-Webseiten und Empfehlungen',
        'Angebote, Buchungen und Rechnungen an einem Ort',
      ],
    },
    resume: {
      title: 'Ihre Website-Analyse ist gespeichert',
      intro:
        'wir haben Ihre Live-Analyse gespeichert. Sie können jederzeit fortfahren und Ihre Ergebnisse im Kundenportal ansehen.',
      cta: 'Analyse ansehen & Portal öffnen',
      note: 'Der Link bleibt 7 Tage gültig. Danach können Sie einen neuen Portal-Link anfordern.',
      resumeLinkLabel: 'Analyse später fortsetzen',
      portalBullets: [
        'Website-Analyse mit SEO-, Design- und Performance-Ergebnissen',
        'Ihre gespeicherten Lieblings-Webseiten und Empfehlungen',
        'Angebote, Buchungen und Rechnungen an einem Ort',
      ],
    },
  },
  wachstumsarchitektur: {
    new_customer: {
      title: 'Ihr WebWelle Kundenportal ist bereit',
      intro:
        'richten Sie Ihr Kundenportal ein, vergeben Sie Ihr Passwort und öffnen Sie direkt Ihre Projektanalyse.',
      cta: 'Kundenportal einrichten & Projektanalyse ansehen',
      note: 'Nach der Einrichtung landen Sie direkt im Bereich Ihrer Projektanalyse im Kundenportal.',
      resumeLinkLabel: 'Projekt später fortsetzen',
      portalBullets: [
        'Ihre Projektbeschreibung und Ersteinschätzung',
        'Passende Lösungsbausteine und Empfehlungen',
        'Angebote, Buchungen und Rechnungen an einem Ort',
      ],
    },
    existing_unactivated: {
      title: 'Portal aktivieren und Projektanalyse verbinden',
      intro:
        'wir haben Ihre neue Projektanalyse Ihrem bestehenden WebWelle-Konto zugeordnet. Aktivieren Sie jetzt den Portalzugang und vergeben Sie Ihr Passwort.',
      cta: 'Portal aktivieren & Projektanalyse verbinden',
      note: 'Bestehende Buchungen und Rechnungen bleiben erhalten und werden mit dieser Projektanalyse verbunden.',
      resumeLinkLabel: 'Projekt später fortsetzen',
      portalBullets: [
        'Ihre Projektbeschreibung und Ersteinschätzung',
        'Passende Lösungsbausteine und Empfehlungen',
        'Angebote, Buchungen und Rechnungen an einem Ort',
      ],
    },
    existing_active: {
      title: 'Ihre neue Projektanalyse ist im Kundenportal bereit',
      intro:
        'wir haben Ihre Projektanalyse mit Ihrem bestehenden Kundenportal verbunden. Melden Sie sich an, um die Ergebnisse anzusehen.',
      cta: 'Einloggen & Projektanalyse ansehen',
      note: 'Ihr bestehendes Passwort bleibt unverändert. Falls Sie es vergessen haben, nutzen Sie bitte den Passwort-zurücksetzen-Link im Login.',
      resumeLinkLabel: 'Projekt später fortsetzen',
      portalBullets: [
        'Ihre Projektbeschreibung und Ersteinschätzung',
        'Passende Lösungsbausteine und Empfehlungen',
        'Angebote, Buchungen und Rechnungen an einem Ort',
      ],
    },
    resume: {
      title: 'Ihre Projektanalyse ist gespeichert',
      intro:
        'wir haben Ihre Projektanalyse gespeichert. Sie können jederzeit fortfahren und Ihre Ergebnisse im Kundenportal ansehen.',
      cta: 'Projektanalyse ansehen & Portal öffnen',
      note: 'Der Link bleibt 7 Tage gültig. Danach können Sie einen neuen Portal-Link anfordern.',
      resumeLinkLabel: 'Projekt später fortsetzen',
      portalBullets: [
        'Ihre Projektbeschreibung und Ersteinschätzung',
        'Passende Lösungsbausteine und Empfehlungen',
        'Angebote, Buchungen und Rechnungen an einem Ort',
      ],
    },
  },
};

interface WebWellePortalMailParams {
  customerName: string;
  customerEmail?: string;
  activationLink: string;
  resumeLink?: string;
  isResume?: boolean;
  variant?: PortalMailVariant;
  mailKind?: PortalMailKind;
}

export function renderWebWellePortalActivationEmail(params: WebWellePortalMailParams) {
  const safeName = escapeHtml(params.customerName || 'Guten Tag');
  const variant = params.variant || (params.isResume ? 'resume' : 'new_customer');
  const mailKind = params.mailKind === 'wachstumsarchitektur' ? 'wachstumsarchitektur' : 'starterwelle';
  const safeEmail = params.customerEmail ? escapeHtml(params.customerEmail) : '';
  const copy = PORTAL_MAIL_COPY[mailKind][variant];
  const title = copy.title;
  const intro = copy.intro;
  const resumeLink = params.resumeLink;
  const portalBulletsHtml = copy.portalBullets
    .map((bullet, index) => {
      const margin = index < copy.portalBullets.length - 1 ? 'margin:0 0 10px;' : 'margin:0;';
      return `<p style="${margin}color:${L.body};">${escapeHtml(bullet)}</p>`;
    })
    .join('');

  const subtitleHtml = `<p style="margin:12px 0 0;color:${L.body};font-size:16px;line-height:1.65;">Hallo ${safeName}, ${escapeHtml(intro)}</p>${
    safeEmail
      ? `<p style="margin:14px 0 0;color:${L.muted};font-size:14px;">Diese Nachricht wurde für <strong style="color:${L.heading};">${safeEmail}</strong> erstellt.</p>`
      : ''
  }`;

  const bodyHtml = `
    ${emailPanel(`
      <p style="margin:0 0 14px;color:${L.heading};font-weight:700;">Im Portal sehen Sie:</p>
      ${portalBulletsHtml}
    `)}
    <div style="text-align:center;margin:28px 0 20px;">
      ${emailButton(params.activationLink, escapeHtml(copy.cta))}
    </div>
    ${
      resumeLink
        ? `<p style="text-align:center;margin:0 0 24px;color:${L.muted};font-size:14px;">Oder ohne Portal fortsetzen: <a href="${resumeLink}" style="color:${L.primary};text-decoration:none;font-weight:700;">${escapeHtml(copy.resumeLinkLabel)}</a></p>`
        : ''
    }
    <div style="border-top:1px solid ${L.border};padding-top:18px;color:${L.muted};font-size:13px;line-height:1.6;">
      ${escapeHtml(copy.note)}
    </div>
  `;

  const html = renderWebWelleEmailShell({
    title,
    bodyHtml,
    subtitleHtml,
  });

  const text = `${title}

Hallo ${params.customerName || 'Guten Tag'},

${intro}

${params.customerEmail ? `Ziel-E-Mail: ${params.customerEmail}\n\n` : ''}

${copy.cta}:
${params.activationLink}

${resumeLink ? `Analyse später fortsetzen:\n${resumeLink}\n\n` : ''}${copy.note}

WebWelle | info@webwelle.com`;

  return { html, text };
}

interface WebWelleInvoiceMailParams {
  customerName: string;
  customerEmail?: string;
  invoiceNumber: string;
  customerNumber?: string | null;
}

export function renderWebWelleInvoiceEmail(params: WebWelleInvoiceMailParams) {
  const safeName = escapeHtml(params.customerName || 'Guten Tag');
  const safeEmail = params.customerEmail ? escapeHtml(params.customerEmail) : '';
  const safeInvoice = escapeHtml(params.invoiceNumber);
  const title = 'Ihre Rechnung von WebWelle';

  const subtitleHtml = `<p style="margin:12px 0 0;color:${L.body};font-size:16px;line-height:1.65;">Hallo ${safeName}, vielen Dank für Ihre Bestellung bei WebWelle.</p>${
    safeEmail
      ? `<p style="margin:14px 0 0;color:${L.muted};font-size:14px;">Rechnung für <strong style="color:${L.heading};">${safeEmail}</strong></p>`
      : ''
  }`;

  const bodyHtml = `
    ${emailPanel(`
      <p style="margin:0 0 10px;color:${L.heading};font-weight:700;">Rechnungsnummer: ${safeInvoice}</p>
      ${
        params.customerNumber
          ? `<p style="margin:0;color:${L.body};">Kundennummer: <strong style="color:${L.heading};">${escapeHtml(params.customerNumber)}</strong></p>`
          : ''
      }
      <p style="margin:14px 0 0;color:${L.body};line-height:1.6;">Im Anhang finden Sie Ihre Rechnung als PDF. Sie können Ihre Rechnungen auch jederzeit in Ihrem Kundenportal einsehen.</p>
    `)}
    <div style="text-align:center;margin:8px 0 0;">
      ${emailButton('https://webwelle.com/customer', 'Zum Kundenportal')}
    </div>
  `;

  const html = renderWebWelleEmailShell({
    title,
    bodyHtml,
    subtitleHtml,
  });

  const text = `${title}

Hallo ${params.customerName || 'Guten Tag'},

vielen Dank für Ihre Bestellung bei WebWelle. Im Anhang finden Sie Ihre Rechnung.

Rechnungsnummer: ${params.invoiceNumber}
${params.customerNumber ? `Kundennummer: ${params.customerNumber}\n` : ''}
Sie können Ihre Rechnungen auch jederzeit in Ihrem Kundenportal einsehen.

Zum Kundenportal: https://webwelle.com/customer

WebWelle | info@webwelle.com`;

  return { html, text };
}
