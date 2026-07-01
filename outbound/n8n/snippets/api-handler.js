/**
 * n8n API handler: status, draft GET/PATCH, send
 * Webhook path determines action via $json.path or node name
 */
const httpRequest = this.helpers.httpRequest.bind(this.helpers);

function storeApi() {
  const store = $getWorkflowStaticData('global');
  if (!store.prospects) store.prospects = {};
  return {
    get(id) { return store.prospects[id] || null; },
    save(id, data) {
      store.prospects[id] = { ...data, updatedAt: new Date().toISOString() };
      return store.prospects[id];
    },
  };
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Outbound-Secret',
  };
}

function verify(headers) {
  const exp = $env.OUTBOUND_API_SECRET || $env.N8N_WEBHOOK_SECRET || '';
  if (!exp) return true;
  const got = headers?.['x-outbound-secret'] || headers?.['X-Outbound-Secret'] || '';
  return got === exp;
}

function respond(statusCode, body, extraHeaders = {}) {
  return [{
    json: {
      __response: true,
      statusCode,
      headers: { ...cors(), 'Content-Type': 'application/json', ...extraHeaders },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    },
  }];
}

const item = items[0].json;
const headers = item.headers || {};
const method = (item.httpMethod || item.method || 'GET').toUpperCase();

let route = 'unknown';
try {
  if ($('Webhook Status').isExecuted) route = 'status';
  else if ($('Webhook Draft GET').isExecuted) route = 'draft-get';
  else if ($('Webhook Draft POST').isExecuted) route = 'draft-patch';
  else if ($('Webhook Send').isExecuted) route = 'send';
  else if ($('Webhook OPTIONS').isExecuted) route = 'options';
} catch { /* single-webhook import */ }

const path = item.path || item.webhookPath || route;

if (method === 'OPTIONS' || route === 'options') {
  return respond(204, '');
}

if (!verify(headers)) {
  return respond(401, { error: 'Unauthorized' });
}

const store = storeApi();
const query = item.query || {};
let body = item.body && typeof item.body === 'object' ? item.body : {};
try {
  const raw = item.body;
  if (typeof raw === 'string' && raw.trim()) body = JSON.parse(raw);
} catch { body = {}; }
const prospectId = query.id || body.id || '';

// Route: outbound-status
if (route === 'status' || path.includes('outbound-status')) {
  const p = store.get(prospectId);
  if (!p) return respond(404, { error: 'not_found' });
  return respond(200, { id: p.id, status: p.status, domain: p.domain, updatedAt: p.updatedAt });
}

// Route: outbound-draft GET
if (route === 'draft-get' || (path.includes('outbound-draft') && method === 'GET' && !path.includes('update'))) {
  const p = store.get(prospectId);
  if (!p) return respond(404, { error: 'not_found' });
  const { pdfBase64, ...safe } = p;
  return respond(200, { ...safe, hasPdf: Boolean(pdfBase64) });
}

// Route: outbound-draft POST/PATCH (Browser nutzt POST wegen CORS)
if (route === 'draft-patch' || path.includes('outbound-draft-update')) {
  const p = store.get(prospectId);
  if (!p) return respond(404, { error: 'not_found' });
  const patch = body.patch || body;
  if (patch.contacts) p.contacts = { ...p.contacts, ...patch.contacts };
  if (patch.company) p.company = { ...p.company, ...patch.company };
  if (patch.email) p.email = { ...p.email, ...patch.email };
  if (patch.offer) p.offer = { ...p.offer, ...patch.offer };
  if (patch.googleBusiness) p.googleBusiness = { ...p.googleBusiness, ...patch.googleBusiness };
  if (Array.isArray(patch.painPoints)) p.offer = { ...p.offer, painPoints: patch.painPoints };
  if (patch.pdfBase64) p.pdfBase64 = patch.pdfBase64;
  p.editedByUser = true;
  store.save(prospectId, p);
  return respond(200, { ok: true, id: prospectId, hasPdf: Boolean(p.pdfBase64) });
}

// Route: outbound-send
if (route === 'send' || path.includes('outbound-send')) {
  const p = store.get(prospectId);
  if (!p) return respond(404, { error: 'not_found' });
  const to = body.to || p.contacts?.preferredEmail;
  if (!to) return respond(400, { error: 'no_recipient' });
  if (body.pdfBase64) p.pdfBase64 = body.pdfBase64;

  const user = $env.EMAIL_SMTP_USER || $env.EMAIL_USER;
  const pass = $env.EMAIL_SMTP_PASSWORD || $env.EMAIL_PASS;
  if (!user || !pass) return respond(500, { error: 'smtp_not_configured' });

  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch {
    return respond(500, {
      error: 'nodemailer_not_allowed',
      hint: 'In Coolify n8n: N8N_RUNNERS_CODE_ALLOWED_EXTERNAL_PACKAGES=nodemailer setzen und Container neu starten',
    });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com', port: 465, secure: true, auth: { user, pass },
  });

  const attachments = [];
  if (p.pdfBase64) {
    attachments.push({
      filename: `WebWelle-Audit-${p.domain || 'Kunde'}.pdf`,
      content: Buffer.from(p.pdfBase64, 'base64'),
      contentType: 'application/pdf',
    });
  }

  await transporter.sendMail({
    from: `"Herr Manie, WebWelle" <${user}>`,
    to,
    subject: p.email?.subject || `Kurzanalyse ${p.domain}`,
    html: p.email?.html || '',
    attachments,
  });

  p.status = 'sent';
  p.sentAt = new Date().toISOString();
  p.sentTo = to;
  store.save(prospectId, p);
  return respond(200, { ok: true, sentTo: to });
}

return respond(400, { error: 'unknown_route', path, method });
