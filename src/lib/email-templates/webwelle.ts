import { WW_COLORS, WW_EMAIL } from '../design-tokens';

const C = WW_COLORS;

interface WebWellePortalMailParams {
  customerName: string;
  customerEmail?: string;
  activationLink: string;
  resumeLink?: string;
  isResume?: boolean;
  variant?: 'new_customer' | 'existing_unactivated' | 'existing_active' | 'resume';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderWebWellePortalActivationEmail(params: WebWellePortalMailParams) {
  const safeName = escapeHtml(params.customerName || 'Guten Tag');
  const variant = params.variant || (params.isResume ? 'resume' : 'new_customer');
  const safeEmail = params.customerEmail ? escapeHtml(params.customerEmail) : '';
  const copy = {
    new_customer: {
      title: 'Ihr WebWelle Kundenportal ist bereit',
      intro:
        'richten Sie Ihr Kundenportal ein, vergeben Sie Ihr Passwort und öffnen Sie direkt Ihre Website-Analyse.',
      cta: 'Kundenportal einrichten & Analyse ansehen',
      note: 'Nach der Einrichtung landen Sie direkt im Analysebereich Ihres neuen Kundenportals.',
    },
    existing_unactivated: {
      title: 'Portal aktivieren und Analyse verbinden',
      intro:
        'wir haben Ihre neue Website-Analyse Ihrem bestehenden WebWelle-Konto zugeordnet. Aktivieren Sie jetzt den Portalzugang und vergeben Sie Ihr Passwort.',
      cta: 'Portal aktivieren & Analyse verbinden',
      note: 'Bestehende Buchungen und Rechnungen bleiben erhalten und werden mit dieser Analyse verbunden.',
    },
    existing_active: {
      title: 'Ihre neue Analyse ist im Kundenportal bereit',
      intro:
        'wir haben Ihre Website-Analyse mit Ihrem bestehenden Kundenportal verbunden. Melden Sie sich an, um die Ergebnisse anzusehen.',
      cta: 'Einloggen & Analyse ansehen',
      note: 'Ihr bestehendes Passwort bleibt unverändert. Falls Sie es vergessen haben, nutzen Sie bitte den Passwort-zurücksetzen-Link im Login.',
    },
    resume: {
      title: 'Ihre Website-Analyse ist gespeichert',
      intro:
        'wir haben Ihre Live-Analyse gespeichert. Sie können jederzeit fortfahren und Ihre Ergebnisse im Kundenportal ansehen.',
      cta: 'Analyse ansehen & Portal öffnen',
      note: 'Der Link bleibt 7 Tage gültig. Danach können Sie einen neuen Portal-Link anfordern.',
    },
  }[variant];
  const title = copy.title;
  const intro = copy.intro;
  const resumeLink = params.resumeLink;

  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title} | WebWelle</title>
  </head>
  <body style="margin:0;padding:0;background:${C.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#f8fafc;">
    <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
      <div style="border:1px solid ${WW_EMAIL.brandBorder};border-radius:24px;overflow:hidden;background:${WW_EMAIL.cardGradient};box-shadow:0 24px 80px rgba(0,0,0,.35);">
        <div style="padding:34px 32px 22px;border-bottom:1px solid ${WW_EMAIL.brandBorderLight};">
          <div style="letter-spacing:.18em;text-transform:uppercase;color:${C.primary};font-size:12px;font-weight:700;">WebWelle</div>
          <h1 style="margin:12px 0 10px;font-size:30px;line-height:1.2;color:#ffffff;">${title}</h1>
          <p style="margin:0;color:#cbd5e1;font-size:16px;line-height:1.65;">Hallo ${safeName}, ${intro}</p>
          ${safeEmail ? `<p style="margin:14px 0 0;color:#94a3b8;font-size:14px;">Diese Nachricht wurde fuer <strong style="color:#f8fafc;">${safeEmail}</strong> erstellt.</p>` : ''}
        </div>

        <div style="padding:30px 32px;">
          <div style="background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:22px;margin-bottom:28px;">
            <p style="margin:0 0 14px;color:#f8fafc;font-weight:700;">Im Portal sehen Sie:</p>
            <p style="margin:0 0 10px;color:#cbd5e1;">Website-Analyse mit SEO-, Design- und Performance-Ergebnissen</p>
            <p style="margin:0 0 10px;color:#cbd5e1;">Ihre gespeicherten Lieblings-Webseiten und Empfehlungen</p>
            <p style="margin:0;color:#cbd5e1;">Angebote, Buchungen und Rechnungen an einem Ort</p>
          </div>

          <div style="text-align:center;margin:28px 0 20px;">
            <a href="${params.activationLink}" style="display:inline-block;background:${C.brand};color:${C.brandForeground};text-decoration:none;font-weight:800;padding:16px 26px;border-radius:999px;box-shadow:0 10px 26px ${WW_EMAIL.brandShadow};">
              ${copy.cta}
            </a>
          </div>

          ${resumeLink ? `<p style="text-align:center;margin:0 0 24px;color:#94a3b8;font-size:14px;">Oder ohne Portal fortsetzen: <a href="${resumeLink}" style="color:${C.primary};text-decoration:none;font-weight:700;">Analyse später fortsetzen</a></p>` : ''}

          <div style="border-top:1px solid rgba(255,255,255,.1);padding-top:18px;color:#94a3b8;font-size:13px;line-height:1.6;">
            ${copy.note}
          </div>
        </div>
      </div>
      <p style="text-align:center;color:#64748b;font-size:12px;margin:18px 0 0;">WebWelle | info@webwelle.com</p>
    </div>
  </body>
</html>`;

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
