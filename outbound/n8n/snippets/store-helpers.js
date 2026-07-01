/**
 * n8n Code Node: Prospect store helpers (global static data).
 * Usage: const { getProspect, saveProspect } = storeApi();
 */
function storeApi() {
  const store = $getWorkflowStaticData('global');
  if (!store.prospects) store.prospects = {};
  return {
    getProspect(id) {
      return store.prospects[id] || null;
    },
    saveProspect(id, data) {
      store.prospects[id] = { ...data, updatedAt: new Date().toISOString() };
      return store.prospects[id];
    },
    listIds() {
      return Object.keys(store.prospects);
    },
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Outbound-Secret',
  };
}

function verifySecret(headers) {
  const expected = $env.OUTBOUND_API_SECRET || '';
  if (!expected) return true;
  const got = headers?.['x-outbound-secret'] || headers?.['X-Outbound-Secret'] || '';
  return got === expected;
}

function normalizeUrl(input) {
  const s = String(input || '').trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function domainFromUrl(url) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

function newProspectId() {
  return `ob_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

module.exports = { storeApi, corsHeaders, verifySecret, normalizeUrl, domainFromUrl, newProspectId };
