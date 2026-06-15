import { WW_EMAIL_LIGHT as L } from '../design-tokens';

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function emailButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${L.brand};color:${L.brandText};text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px;font-size:16px;">${label}</a>`;
}

export function emailPanel(contentHtml: string) {
  return `<div style="background:${L.panelBg};border:1px solid ${L.border};border-radius:12px;padding:24px;margin:24px 0;">${contentHtml}</div>`;
}

export function emailDetailRow(label: string, value: string, options?: { monospace?: boolean }) {
  const valueStyle = options?.monospace
    ? `color:${L.muted};font-family:monospace;font-size:14px;`
    : `color:${L.heading};font-weight:600;`;
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid ${L.border};">
      <span style="color:${L.muted};font-weight:500;">${label}</span>
      <span style="${valueStyle}">${value}</span>
    </div>`;
}

interface WebWelleEmailShellParams {
  title: string;
  pageTitle?: string;
  subtitleHtml?: string;
  bodyHtml: string;
  footerHtml?: string;
}

export function renderWebWelleEmailShell(params: WebWelleEmailShellParams): string {
  const pageTitle = escapeHtml(params.pageTitle || params.title);
  const title = escapeHtml(params.title);
  const year = new Date().getFullYear();
  const footer =
    params.footerHtml ||
    `<p style="color:${L.muted};font-size:12px;margin:0;">© ${year} WebWelle. Alle Rechte vorbehalten.</p>`;

  return `<!DOCTYPE html>
<html lang="de" style="color-scheme:light;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${pageTitle} | WebWelle</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:${L.pageBg};color:${L.body};">
  <div style="max-width:600px;margin:0 auto;padding:28px 16px;">
    <div style="border:1px solid ${L.border};border-radius:16px;overflow:hidden;background:${L.cardBg};box-shadow:0 4px 24px rgba(15,23,42,0.08);">
      <div style="padding:32px 30px 20px;border-bottom:1px solid ${L.border};text-align:center;">
        <div style="letter-spacing:.18em;text-transform:uppercase;color:${L.primary};font-size:12px;font-weight:700;">WebWelle</div>
        <h1 style="color:${L.heading};font-size:26px;font-weight:700;margin:12px 0 6px 0;line-height:1.25;">${title}</h1>
        ${params.subtitleHtml || ''}
      </div>
      <div style="padding:30px;">
        ${params.bodyHtml}
      </div>
      <div style="padding:20px 30px;text-align:center;border-top:1px solid ${L.border};background:${L.panelBg};">
        ${footer}
      </div>
    </div>
    <p style="text-align:center;color:${L.muted};font-size:12px;margin:16px 0 0;">WebWelle | info@webwelle.com</p>
  </div>
</body>
</html>`;
}
