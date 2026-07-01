#!/usr/bin/env node
/**
 * Lokaler Outbound-UI-Server (Mac): statische UI + E-Mail-Versand via .env.local SMTP.
 * Analyse/Draft weiterhin über n8n VPS; Versand lokal ohne n8n-SMTP-Konfiguration.
 *
 *   node outbound/scripts/serve-ui.mjs
 *   npm run outbound:ui
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { buildAuditPdfBuffer, isPdfBuffer } from './build-audit-pdf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.join(__dirname, '../ui');
const rootEnv = path.join(__dirname, '../../.env.local');
const outboundEnv = path.join(__dirname, '../.env');
const PORT = Number(process.env.OUTBOUND_UI_PORT || 3000);
const SERVER_VERSION = 2;

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const env = { ...loadEnv(outboundEnv), ...loadEnv(rootEnv) };
const smtpUser = env.EMAIL_SMTP_USER || env.EMAIL_USER;
const smtpPass = env.EMAIL_SMTP_PASSWORD || env.EMAIL_PASS;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleSend(raw) {
  if (!smtpUser || !smtpPass) {
    return {
      status: 500,
      json: {
        error: 'smtp_not_configured',
        hint: 'EMAIL_SMTP_USER und EMAIL_SMTP_PASSWORD in .env.local (Projektroot) eintragen – gleiche Werte wie WebWelle.',
      },
    };
  }
  const data = JSON.parse(raw || '{}');
  const { to, subject, html, pdfBase64, domain } = data;
  if (!to) return { status: 400, json: { error: 'no_recipient' } };

  const transporter = nodemailer.createTransport({
    host: env.EMAIL_SMTP_HOST || 'smtp.hostinger.com',
    port: Number(env.EMAIL_SMTP_PORT || 465),
    secure: env.EMAIL_SMTP_SECURE !== 'false',
    auth: { user: smtpUser, pass: smtpPass },
  });

  const attachments = [];
  if (pdfBase64) {
    const buf = Buffer.from(pdfBase64, 'base64');
    if (!isPdfBuffer(buf)) {
      return { status: 400, json: { error: 'invalid_pdf', hint: 'PDF-Anhang leer oder ungültig – bitte PDF erneut erzeugen.' } };
    }
    attachments.push({
      filename: `WebWelle-Audit-${domain || 'Kunde'}.pdf`,
      content: buf,
      contentType: 'application/pdf',
    });
  }

  await transporter.sendMail({
    from: `"Herr Manie, WebWelle" <${smtpUser}>`,
    to,
    subject: subject || `Kurzanalyse ${domain || ''}`,
    html: html || '<p>WebWelle Outbound</p>',
    attachments,
  });

  return { status: 200, json: { ok: true, sentTo: to, via: 'local-mac' } };
}

async function handlePdf(raw) {
  const data = JSON.parse(raw || '{}');
  const prospect = data.prospect;
  if (!prospect || !prospect.domain) {
    return { status: 400, json: { error: 'prospect_required' } };
  }
  const buf = await buildAuditPdfBuffer(prospect);
  if (!isPdfBuffer(buf)) {
    return { status: 500, json: { error: 'pdf_generation_failed' } };
  }
  return { status: 200, json: { pdfBase64: buf.toString('base64'), bytes: buf.length } };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (url.pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({
      ok: true,
      version: SERVER_VERSION,
      pdf: true,
      send: Boolean(smtpUser && smtpPass),
    }));
    return;
  }

  if (url.pathname === '/api/outbound-pdf' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { status, json } = await handlePdf(body);
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(json));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  if (url.pathname === '/api/outbound-send' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { status, json } = await handleSend(body);
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(json));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  if (req.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  let rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');
  const filePath = path.join(uiRoot, rel);
  if (!filePath.startsWith(uiRoot)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`WebWelle Outbound UI v${SERVER_VERSION}: http://localhost:${PORT}`);
  console.log('API: /api/health · /api/outbound-pdf · /api/outbound-send');
  console.log(`Analyse/Draft: n8n VPS (config.js)`);
  console.log(`E-Mail-Versand lokal: ${smtpUser ? `ja (${smtpUser})` : 'NEIN – .env.local SMTP fehlt'}`);
  console.log('PDF: im Browser (jsPDF) + optional Server (pdfkit)');
});
