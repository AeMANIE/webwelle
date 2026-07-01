/**
 * Full outbound pipeline for n8n Code node (outbound-analyze-v1).
 * Input: items[0].json.body = { websiteUrl, googleMapsUrl?, industryHint? }
 */
const httpRequest = this.helpers.httpRequest.bind(this.helpers);

function storeApi() {
  const store = $getWorkflowStaticData('global');
  if (!store.prospects) store.prospects = {};
  return {
    get(id) { return store.prospects[id] || null; },
    save(id, data) {
      const { pdfBase64, ...rest } = data || {};
      if (rest.email?.html) {
        const { html, ...emailRest } = rest.email;
        rest.email = emailRest;
      }
      store.prospects[id] = { ...rest, updatedAt: new Date().toISOString() };
      return store.prospects[id];
    },
  };
}

function normalizeUrl(input) {
  const s = String(input || '').trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function domainFromUrl(url) {
  const m = normalizeUrl(url).match(/^https?:\/\/(?:www\.)?([^/?#]+)/i);
  return m ? m[1].replace(/^www\./i, '') : '';
}

function joinUrl(base, subPath) {
  const b = normalizeUrl(base).replace(/\/$/, '');
  const p = String(subPath || '').startsWith('/') ? subPath : `/${subPath}`;
  return b + p;
}

function extractJson(text) {
  if (!text) return null;
  const t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const c = fence ? fence[1].trim() : t;
  try { return JSON.parse(c); } catch {
    const a = c.indexOf('{'); const b = c.lastIndexOf('}');
    if (a >= 0 && b > a) try { return JSON.parse(c.slice(a, b + 1)); } catch { return null; }
    return null;
  }
}

async function fetchHtml(url) {
  try {
    const res = await httpRequest({
      method: 'GET',
      url: normalizeUrl(url),
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-DE,de;q=0.9',
      },
      ignoreResponseCode: true,
      json: false,
      skipSslCertificateValidation: true,
    });
    if (typeof res === 'string') return res;
    if (res?.body != null) return String(res.body);
    if (res?.data != null) return String(res.data);
    return '';
  } catch { return ''; }
}

function detectTech(html) {
  const h = String(html).toLowerCase();
  const rules = [
    { platform: 'WordPress', p: ['wp-content', 'wp-includes'], builder: true },
    { platform: 'Wix', p: ['wix.com', 'wixstatic'], builder: true },
    { platform: 'Shopify', p: ['cdn.shopify.com', 'shopify'], builder: true },
    { platform: 'Jimdo', p: ['jimdo.com', 'jimstatic'], builder: true },
    { platform: 'Webflow', p: ['webflow.com', 'data-wf-page'], builder: true },
    { platform: 'Next.js / React', p: ['__next_data__', '/_next/static'], builder: false },
  ];
  let best = { platform: 'Unbekannt', confidence: 0.3, signals: [], isPageBuilder: false,
    recommendation: 'Professioneller Neustart mit StarterWelle prüfen.' };
  for (const r of rules) {
    const m = r.p.filter((x) => h.includes(x));
    if (m.length && m.length >= best.signals.length) {
      best = { platform: r.platform, confidence: 0.5 + m.length * 0.15, signals: m, isPageBuilder: r.builder,
        recommendation: r.builder ? 'StarterWelle: React statt Baukasten.' : 'Technische Basis optimierbar.' };
    }
  }
  return best;
}

function seoFromHtml(html) {
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim() || '';
  const meta = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i) || [])[1]?.trim() || '';
  const h1 = (html.match(/<h1[^>]*>([^<]*)<\/h1>/i) || [])[1]?.replace(/<[^>]+>/g, '').trim() || '';
  return { title, metaDescription: meta, h1, titleOk: title.length >= 15, metaOk: meta.length >= 50,
    gaps: [...(title.length < 15 ? ['Titel schwach'] : []), ...(meta.length < 50 ? ['Meta fehlt/kurz'] : []), ...(!h1 ? ['H1 fehlt'] : [])] };
}

async function pageSpeed(url, strategy) {
  const key = $env.GOOGLE_PAGESPEED_API_KEY || '';
  if (!key) return { score: null, lcp: null, cls: null };
  try {
    const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(normalizeUrl(url))}&strategy=${strategy}&category=performance&key=${encodeURIComponent(key)}`;
    const res = await httpRequest({ method: 'GET', url: api, timeout: 60000, json: true });
    const cat = res?.lighthouseResult?.categories?.performance?.score;
    const audits = res?.lighthouseResult?.audits || {};
    return {
      score: cat != null ? Math.round(cat * 100) : null,
      lcp: audits['largest-contentful-paint']?.displayValue || null,
      cls: audits['cumulative-layout-shift']?.displayValue || null,
    };
  } catch { return { score: null, lcp: null, cls: null }; }
}

async function openRouter(messages) {
  const key = $env.OPENROUTER_API_KEY || '';
  const model = $env.WEBWELLE_OPENROUTER_MODEL || $env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  if (!key) return '';
  try {
    const res = await httpRequest({
      method: 'POST', url: 'https://openrouter.ai/api/v1/chat/completions', json: true,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://webwelle.com', 'X-Title': 'WebWelle Outbound' },
      body: { model, temperature: 0.35, messages },
      timeout: 90000,
      ignoreResponseCode: true,
    });
    return res?.choices?.[0]?.message?.content || '';
  } catch { return ''; }
}

function isGenericCompanyTitle(name) {
  const n = String(name || '').trim();
  if (!n || n.length < 3) return true;
  if (/^(webdesign|homepage|website|startseite|willkommen)\b/i.test(n)) return true;
  if (/webdesign.*\([^)]+\)/i.test(n)) return true;
  if (/\b(webdesign|marketing|seo)\b/i.test(n) && !/\b(GmbH|UG|AG|e\.K\.)\b/i.test(n)) return true;
  return false;
}

function brandFromDomain(domain) {
  const raw = domain ? domain.replace(/^www\./i, '').split('.')[0] : '';
  if (!raw || raw.length < 2) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function impressumFromHtml(html) {
  const text = String(html || '');
  const emails = [...new Set((text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [])
    .concat([...(text.match(/mailto:([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi) || []).map((m) => m.replace(/^mailto:/i, ''))])
    .map((e) => e.toLowerCase())
    .filter((e) => !/(wixpress|sentry|example|gravatar|weblabs|wordpress)/i.test(e)))];
  const phones = [...new Set(text.match(/\+49[\d\s()/-]{8,}/g) || [])];
  const streetMatch = text.match(/([A-ZÄÖÜ][\wäöüß.-]*(?:straße|str\.|weg|platz|allee|gasse)\s*\d+[a-z]?)\s*(?:&#8211;|–|-|,)?\s*(\d{5})\s+([A-ZÄÖÜ][\wäöüß-]+)/i)
    || text.match(/([A-ZÄÖÜ][\wäöüß.-]+\s+\d+[a-z]?)[,\s]+(\d{5})\s+([A-ZÄÖÜ][\wäöüß-]+)/i);
  const plzCity = streetMatch
    ? [streetMatch[2], streetMatch[3]]
    : (text.match(/\b(\d{5})\s+([A-ZÄÖÜ][\wäöüß-]+)\b/) || []).slice(1);
  const title = (text.match(/<title[^>]*>([^<]+)/i) || [])[1] || '';
  let companyFromTitle = (title.match(/([A-ZÄÖÜ][\wäöüß&.-]*(?:\s+[A-ZÄÖÜ][\wäöüß&.-]*)*\s+GmbH)/i) || [])[1]
    || title.split('|').pop()?.trim()
    || title.split('|')[0]?.trim()
    || '';
  if (isGenericCompanyTitle(companyFromTitle)) companyFromTitle = '';
  const gmbhMatch = text.match(/([A-ZÄÖÜ][\wäöüß&.\s-]+(?:GmbH|UG|AG|e\.K\.|OHG))/);
  const companyFromImpressum = gmbhMatch?.[1]?.replace(/\s+/g, ' ').trim() || '';
  return {
    companyName: companyFromImpressum || companyFromTitle,
    street: streetMatch?.[1]?.replace(/\s+/g, ' ').trim() || '',
    emails,
    phones,
    preferredEmail: emails.find((e) => /info@|kontakt@/i.test(e)) || emails[0] || '',
    postalCode: plzCity?.[0] || '',
    city: plzCity?.[1] || '',
    industryGuess: '',
  };
}

async function impressumExtract({ impressumHtml, homeHtml, domain }) {
  const fromImpressum = impressumFromHtml(impressumHtml);
  const fromHome = impressumFromHtml(homeHtml);
  const tradeName = brandFromDomain(domain);
  const regexBase = {
    street: fromImpressum.street || fromHome.street,
    postalCode: fromImpressum.postalCode || fromHome.postalCode,
    city: fromImpressum.city || fromHome.city,
    emails: [...new Set([...(fromImpressum.emails || []), ...(fromHome.emails || [])])],
    phones: [...new Set([...(fromImpressum.phones || []), ...(fromHome.phones || [])])],
    preferredEmail: fromImpressum.preferredEmail || fromHome.preferredEmail,
    companyName: (fromImpressum.companyName && !isGenericCompanyTitle(fromImpressum.companyName))
      ? fromImpressum.companyName
      : ((fromHome.companyName && !isGenericCompanyTitle(fromHome.companyName)) ? fromHome.companyName : ''),
    tradeName,
    industryGuess: '',
  };
  const chunks = [impressumHtml, homeHtml].filter((c) => c && c.length > 200);
  const text = chunks.map((c) => c.slice(0, 4000)).join('\n---\n').slice(0, 12000);
  const raw = await openRouter([
    { role: 'system', content: 'Extrahiere Impressum/Kontakt als JSON: { companyName, managingDirector, street, postalCode, city, phones[], emails[], preferredEmail, industryGuess }. Nur JSON. companyName = juristische Firma aus Impressum, nicht SEO-Titel.' },
    { role: 'user', content: text },
  ]);
  const parsed = extractJson(raw) || {};
  if (isGenericCompanyTitle(parsed.companyName)) parsed.companyName = '';
  return {
    ...regexBase,
    ...parsed,
    emails: (Array.isArray(parsed.emails) && parsed.emails.length) ? parsed.emails : regexBase.emails,
    phones: (Array.isArray(parsed.phones) && parsed.phones.length) ? parsed.phones : regexBase.phones,
    preferredEmail: parsed.preferredEmail || regexBase.preferredEmail,
    companyName: parsed.companyName || regexBase.companyName || tradeName,
    street: parsed.street || regexBase.street,
    postalCode: parsed.postalCode || regexBase.postalCode,
    city: parsed.city || regexBase.city,
    tradeName,
  };
}

function normGbpToken(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '');
}

function parseMapsPlaceId(url) {
  const m = String(url || '').match(/[?&]place_id=([A-Za-z0-9_-]+)/i);
  return m?.[1] || '';
}

function websiteMatchesDomain(websiteUri, domain) {
  if (!websiteUri || !domain) return false;
  return normGbpToken(websiteUri).includes(normGbpToken(domain));
}

function buildGbpQueries({ companyName, city, postalCode, street, domain, tradeName }) {
  const brand = tradeName || (domain ? domain.replace(/^www\./i, '').split('.')[0] : '');
  const shortName = companyName?.replace(/\s*(GmbH|UG|AG|e\.K\.|OHG).*$/i, '').trim();
  const queries = [];
  if (brand && city) queries.push(`${brand} ${city}`);
  if (brand) queries.push(`${brand}`);
  if (companyName && city) queries.push(`${companyName} ${city}`);
  if (companyName && postalCode && city) queries.push(`${companyName} ${postalCode} ${city}`);
  if (domain) queries.push(domain);
  if (companyName && street && city) queries.push(`${companyName} ${street} ${city}`);
  if (shortName && city && shortName !== companyName) queries.push(`${shortName} ${city}`);
  if (companyName) queries.push(companyName);
  return [...new Set(queries.filter((q) => q && q.length > 3))];
}

function scoreGbpCandidate(candidate, ctx) {
  const { domain, companyName, city, postalCode, tradeName } = ctx;
  const dom = normGbpToken(domain);
  const name = normGbpToken(candidate.name);
  const comp = normGbpToken(companyName);
  const brand = normGbpToken(tradeName || domain?.split('.')[0]);
  const addr = String(candidate.formatted_address || '').toLowerCase();
  let score = 0;
  const webMatch = candidate.website ? websiteMatchesDomain(candidate.website, domain) : false;
  if (webMatch) score += 60;
  else if (candidate.website) score -= 80;
  if (comp && comp.length >= 4 && name.includes(comp.slice(0, Math.min(comp.length, 12)))) score += 30;
  if (brand && brand.length >= 3 && name.includes(brand)) score += 25;
  if (city && addr.includes(String(city).toLowerCase())) score += 20;
  if (postalCode && addr.includes(String(postalCode))) score += 15;
  if (candidate.rating) score += 5;
  return score;
}

async function enrichPlaceCandidate(candidate, mapsKey) {
  if (candidate?.website && candidate?.formatted_address) return candidate;
  const placeId = candidate?.place_id || candidate?.id;
  if (!placeId) return candidate;
  const details = await placeDetailsLegacy(placeId, mapsKey);
  return details || candidate;
}

async function searchPlacesLegacy(textQuery, key) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(textQuery)}&language=de&region=de&key=${encodeURIComponent(key)}`;
    const res = await httpRequest({ method: 'GET', url, timeout: 20000, json: true, ignoreResponseCode: true });
    if (res?.status !== 'OK' && res?.status !== 'ZERO_RESULTS') return { results: [], error: res?.error_message || res?.status };
    return { results: res?.results || [], error: null };
  } catch (e) {
    return { results: [], error: String(e.message || e) };
  }
}

async function placeDetailsLegacy(placeId, key) {
  try {
    const fields = 'name,formatted_address,formatted_phone_number,website,url,rating,user_ratings_total,opening_hours,photos,business_status,types,place_id';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&language=de&fields=${fields}&key=${encodeURIComponent(key)}`;
    const res = await httpRequest({ method: 'GET', url, timeout: 20000, json: true, ignoreResponseCode: true });
    if (res?.status !== 'OK') return null;
    return res?.result || null;
  } catch { return null; }
}

function formatRating(rating) {
  const n = Number(rating);
  if (!Number.isFinite(n)) return '';
  return n.toFixed(1).replace('.', ',');
}

function buildGbpGaps(details) {
  const gaps = [];
  const ratingNum = Number(details.rating);
  const hasRating = Number.isFinite(ratingNum) && ratingNum > 0;
  if (!hasRating) gaps.push('Keine sichtbaren Google-Bewertungen');
  else if ((details.user_ratings_total || 0) < 10) {
    gaps.push(`Nur ${details.user_ratings_total} Google-Bewertung(en) – bei Ø ${formatRating(ratingNum)} ausbaufähig`);
  }
  if (!details.opening_hours?.weekday_text?.length) gaps.push('Öffnungszeiten fehlen oder unvollständig');
  if (!(details.photos || []).length) gaps.push('Keine oder wenige Fotos im Profil');
  else if ((details.photos || []).length < 5) gaps.push('Wenige Fotos – Wettbewerber wirken professioneller');
  gaps.push('Google-Posts & Aktivität manuell prüfen – oft keine regelmäßigen Updates');
  return gaps;
}

function gbpCompleteness(details, websiteMatchesDomain) {
  let score = 25;
  if (details.formatted_address) score += 10;
  if (details.formatted_phone_number) score += 10;
  if (details.website) score += 10;
  if (websiteMatchesDomain) score += 10;
  if (details.rating) score += 10;
  if ((details.user_ratings_total || 0) >= 5) score += 10;
  if ((details.user_ratings_total || 0) >= 15) score += 5;
  if (details.opening_hours?.weekday_text?.length) score += 10;
  if ((details.photos || []).length >= 5) score += 10;
  return Math.min(100, score);
}

async function gbpEnrich({ domain, companyName, city, postalCode, street, phones, googleMapsUrl, tradeName }) {
  const mapsKey = $env.GOOGLE_MAPS_API_KEY || '';
  const notFound = {
    found: false,
    completenessScore: 0,
    gaps: ['Kein Google-Unternehmensprofil auffindbar – lokale Sichtbarkeit und Vertrauen leiden (starkes Verkaufsargument für GMB-Komplettservice).'],
    searchAttempts: [],
  };
  if (!mapsKey) return { ...notFound, gaps: ['GOOGLE_MAPS_API_KEY fehlt auf n8n-Stack'] };

  const ctx = { domain, companyName, city, postalCode, street, phones, tradeName };
  const searchAttempts = [];
  let best = null;
  let bestScore = 0;

  const directPlaceId = parseMapsPlaceId(googleMapsUrl);
  if (directPlaceId) {
    const details = await placeDetailsLegacy(directPlaceId, mapsKey);
    if (details) {
      best = details;
      bestScore = 100;
      searchAttempts.push({ query: `place_id:${directPlaceId}`, hits: 1, topScore: 100 });
    }
  }

  if (!best || bestScore < 50) {
    for (const query of buildGbpQueries(ctx)) {
      const { results, error } = await searchPlacesLegacy(query, mapsKey);
      searchAttempts.push({ query, hits: results.length, error: error || null, top: results[0]?.name });
      for (const r of results.slice(0, 5)) {
        const enriched = await enrichPlaceCandidate(r, mapsKey);
        const s = scoreGbpCandidate(enriched, ctx);
        if (s > bestScore) {
          bestScore = s;
          best = enriched;
        }
      }
      const webOk = best?.website && websiteMatchesDomain(best.website, domain);
      if (bestScore >= 75 && webOk) break;
    }
  }

  if (!best || bestScore < 20) {
    return { ...notFound, searchAttempts };
  }

  const placeId = best.place_id || best.id;
  const details = (best.formatted_phone_number != null && best.website)
    ? best
    : (placeId ? await placeDetailsLegacy(placeId, mapsKey) : null);

  if (!details) return { ...notFound, searchAttempts };

  const websiteUri = details.website || '';
  const domainWebsiteMatch = websiteUri ? normGbpToken(websiteUri).includes(normGbpToken(domain)) : false;
  const gaps = buildGbpGaps(details);
  if (websiteUri && !domainWebsiteMatch) {
    gaps.unshift('Google-Profil verlinkt nicht eindeutig auf die analysierte Website');
  }
  if ((details.user_ratings_total || 0) < 5) {
    gaps.unshift('Sehr wenige Bewertungen – Vertrauensvorteil beim Wettbewerb verschenkt');
  }

  const hours = details.opening_hours?.weekday_text || [];
  const photoCount = (details.photos || []).length;

  return {
    found: true,
    placeId: details.place_id || placeId || '',
    name: details.name || companyName || '',
    address: details.formatted_address || '',
    phone: details.formatted_phone_number || '',
    mapsUrl: details.url || googleMapsUrl || '',
    rating: Number.isFinite(Number(details.rating)) ? Number(details.rating) : null,
    reviewCount: details.user_ratings_total || 0,
    categories: details.types || [],
    websiteUri,
    websiteMatchesDomain: domainWebsiteMatch,
    completenessScore: gbpCompleteness(details, domainWebsiteMatch),
    gaps,
    hoursSet: hours.length > 0,
    openingHours: hours.slice(0, 7),
    photoCount,
    businessStatus: details.business_status || '',
    matchScore: bestScore,
    searchAttempts,
    hasRecentPosts: false,
  };
}

function buildPainPoints(audit) {
  const pts = [];
  if (audit.performance?.mobileScore != null && audit.performance.mobileScore < 60)
    pts.push(`Mobile Performance-Score nur ${audit.performance.mobileScore} – viele Besucher springen ab.`);
  if (audit.seo?.gaps?.length) pts.push(audit.seo.gaps[0]);
  if (audit.technology?.isPageBuilder) pts.push(`Baukasten (${audit.technology.platform}) limitiert Performance und Professionalität.`);
  if (audit.googleBusiness?.found && audit.googleBusiness.completenessScore < 70)
    pts.push(`Google-Unternehmensprofil nur ${audit.googleBusiness.completenessScore}% ausgeschöpft${audit.googleBusiness.rating ? ` (Ø ${String(audit.googleBusiness.rating).replace('.', ',')} Sterne, ${audit.googleBusiness.reviewCount} Bewertungen)` : ''}.`);
  if (audit.googleBusiness?.found && (audit.googleBusiness.reviewCount || 0) < 10)
    pts.push(`Nur ${audit.googleBusiness.reviewCount} Google-Bewertungen – Wettbewerber mit mehr Reviews wirken vertrauenswürdiger.`);
  if (!audit.googleBusiness?.found)
    pts.push('Kein auffindbares Google-Unternehmensprofil – lokale Kunden finden Sie bei Google Maps oft nicht (starkes Argument für GMB-Optimierung).');
  if (audit.legal && !audit.legal.impressumComplete) pts.push('Impressum/rechtliche Angaben unvollständig.');
  return pts.slice(0, 5);
}

function scoreOffers(audit, painPoints) {
  let primary = 'starterwelle';
  const alternatives = [];
  const upsells = [];
  if (audit.technology?.isPageBuilder || (audit.performance?.mobileScore || 100) < 55) { /* starter */ }
  if (painPoints.some((p) => /portal|funnel|komplex/i.test(p))) {
    primary = 'dwa';
  }
  if (audit.seo?.gaps?.length) upsells.push('seo_profi');
  if (!audit.googleBusiness?.found || audit.googleBusiness.completenessScore < 70) upsells.push('gmb_komplett');
  if ((audit.designScore || 5) < 6) upsells.push('branding');
  const ind = (audit.company?.industryGuess || '').toLowerCase();
  if (/beratung|steuer|anwalt|coach|gf/.test(ind)) alternatives.push('executive_ki');
  if (primary !== 'dwa' && painPoints.length >= 4) alternatives.push('dwa');
  let gbpRecommendation = '';
  if (!audit.googleBusiness?.found) {
    gbpRecommendation = 'Wir richten Ihr Google-Unternehmensprofil komplett ein (499 € netto einmalig).';
  }
  return { primary, alternatives: [...new Set(alternatives)], upsells: [...new Set(upsells)], gbpRecommendation };
}

const N8N_PRODUCTS = {
  starterwelle: { name: 'StarterWelle', priceLabel: '699 € netto / 24 Monate', benefit: 'Professioneller React-Auftritt ohne Baukasten-Kompromisse – planbar und klar kalkuliert.' },
  dwa: { name: 'Digitale Wachstumsarchitektur', priceLabel: 'individuelles Angebot', benefit: 'Für Unternehmen mit Funnels, Portalen und Automatisierung.' },
  executive_ki: { name: 'Executive KI-Systeme', priceLabel: 'individuelles Angebot', benefit: 'KI-gestützte Kommunikation und Entscheidungsunterlagen auf C-Level.' },
  seo_profi: { name: 'SEO Profi Zusatzpaket', priceLabel: '299 € netto', benefit: 'Keyword-Strategie, OnPage-Optimierung und Monitoring.' },
  blog_bundle_10: { name: '10 Blog-Artikel Paket', priceLabel: '499 € netto', benefit: 'SEO-optimierte Fachartikel für mehr organischen Traffic.' },
  gmb_komplett: { name: 'Google My Business Komplettservice', priceLabel: '499 € netto einmalig', benefit: '3 KI-Fotos, 3 Google-Posts, Produkte einpflegen, Buchungen aktivieren.' },
  branding: { name: 'Branding & Logo', priceLabel: '199 € netto', benefit: '4 Logo-Entwürfe zur Auswahl.' },
  animation: { name: 'Animationspaket', priceLabel: '999 € netto', benefit: 'Scroll-Animationen ohne Ladezeit-Einbußen.' },
};

function n8nOfferBlock(prospect) {
  const offer = prospect?.offer || {};
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const primary = N8N_PRODUCTS[offer.primary || 'starterwelle'];
  let html = '';
  if (primary) {
    html += `<p style="color:#334155;line-height:1.65;">Mit <strong>${esc(primary.name)}</strong> (${esc(primary.priceLabel)}) ${esc(primary.benefit)}</p>`;
  }
  const alts = (offer.alternatives || []).map((id) => N8N_PRODUCTS[id]).filter(Boolean);
  if (alts.length) {
    html += `<p style="color:#334155;font-size:14px;"><strong>Alternativen:</strong> ${alts.map((a) => `${esc(a.name)} (${esc(a.priceLabel)})`).join(' · ')}</p>`;
  }
  const ups = (offer.upsells || []).map((id) => N8N_PRODUCTS[id]).filter(Boolean);
  if (ups.length) {
    html += '<p style="color:#334155;font-size:14px;"><strong>Zusätzlich empfohlen:</strong></p><ul>';
    for (const u of ups) html += `<li style="margin:6px 0;color:#334155;">${esc(u.name)} – ${esc(u.priceLabel)}: ${esc(u.benefit)}</li>`;
    html += '</ul>';
  }
  if (offer.gbpRecommendation) {
    html += `<p style="color:#b45309;font-size:14px;">${esc(offer.gbpRecommendation)}</p>`;
  }
  if (prospect.email?.alternativeLine) {
    html += `<p style="color:#64748b;font-size:14px;">${esc(prospect.email.alternativeLine)}</p>`;
  }
  return html;
}

function n8nOfferPdfBlock(prospect) {
  const offer = prospect?.offer || {};
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const primary = N8N_PRODUCTS[offer.primary || 'starterwelle'];
  let html = '';
  if (primary) html += `<p><strong>${esc(primary.name)}</strong> – ${esc(primary.priceLabel)}<br>${esc(primary.benefit)}</p>`;
  const alts = (offer.alternatives || []).map((id) => N8N_PRODUCTS[id]).filter(Boolean);
  if (alts.length) {
    html += '<p><strong>Alternativen:</strong></p><ul>' + alts.map((a) => `<li>${esc(a.name)} – ${esc(a.priceLabel)}</li>`).join('') + '</ul>';
  }
  const ups = (offer.upsells || []).map((id) => N8N_PRODUCTS[id]).filter(Boolean);
  if (ups.length) {
    html += '<p><strong>Zusätzlich empfohlen:</strong></p><ul>' + ups.map((u) => `<li>${esc(u.name)} – ${esc(u.priceLabel)}: ${esc(u.benefit)}</li>`).join('') + '</ul>';
  }
  if (offer.gbpRecommendation) html += `<p class="warn">${esc(offer.gbpRecommendation)}</p>`;
  return html;
}

function renderEmailHtml(prospect) {
  const L = { pageBg: '#f1f5f9', card: '#fff', heading: '#0e141f', body: '#334155', muted: '#64748b', border: '#e2e8f0', panel: '#f8fafc', brand: '#8C36C9' };
  const zoom = $env.OUTBOUND_ZOOM_URL || 'https://scheduler.zoom.us/aemanie-gmbh/30-minuten-mit-aemanie-gmbh-herr-manie';
  const pains = (prospect.offer?.painPoints || []).slice(0, 3).map((p) => `<li style="margin:8px 0;color:${L.body};">${p}</li>`).join('');
  const benefits = (prospect.offer?.benefits || []).slice(0, 3).map((b) => `<li style="margin:8px 0;color:${L.body};">${b}</li>`).join('');
  const offerBlock = n8nOfferBlock(prospect);
  return `<!DOCTYPE html><html lang="de"><body style="margin:0;background:${L.pageBg};font-family:system-ui,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
<div style="background:${L.card};border:1px solid ${L.border};border-radius:16px;overflow:hidden;">
<div style="padding:28px 24px;border-bottom:1px solid ${L.border};text-align:center;">
<div style="letter-spacing:.15em;text-transform:uppercase;color:#6699ff;font-size:12px;font-weight:700;">WebWelle</div>
<h1 style="color:${L.heading};font-size:22px;margin:12px 0 0;">${prospect.email?.subject || 'Kurzanalyse Ihrer Online-Präsenz'}</h1>
</div>
<div style="padding:24px;">
<p style="color:${L.body};line-height:1.65;">${prospect.email?.greeting || 'Sehr geehrte Damen und Herren,'}</p>
<p style="color:${L.body};line-height:1.65;">Wir haben <strong>${prospect.domain}</strong>${prospect.googleBusiness?.found ? ' und Ihr Google-Unternehmensprofil' : ''} angeschaut. Drei Punkte sind uns aufgefallen:</p>
<ul>${pains}</ul>
${offerBlock}
<ul>${benefits}</ul>
<p style="text-align:center;margin:28px 0;"><a href="${zoom}" style="display:inline-block;background:${L.brand};color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px;">15 Minuten Zoom vereinbaren</a></p>
<p style="color:${L.muted};font-size:14px;">Im Anhang: detaillierte Analyse als PDF.</p>
<p style="color:${L.body};margin-top:24px;">Mit freundlichen Grüßen<br><strong>Herr Manie, AeManie GmbH, webwelle.com</strong></p>
</div></div></div></body></html>`;
}

function renderPdfHtml(prospect) {
  const p = prospect;
  const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;');
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><style>
body{font-family:system-ui,sans-serif;color:#0e141f;margin:40px;line-height:1.5;}
h1{color:#8C36C9;font-size:28px;} h2{color:#6699ff;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-top:32px;}
.badge{display:inline-block;background:#f5f0fa;color:#8C36C9;padding:4px 12px;border-radius:999px;font-size:12px;}
table{width:100%;border-collapse:collapse;margin:12px 0;} td,th{border:1px solid #e2e8f0;padding:10px;text-align:left;}
.warn{color:#b45309;} .ok{color:#059669;}
</style></head><body>
<h1>Online-Audit: ${esc(p.company?.name || p.domain)}</h1>
<p><span class="badge">${esc(p.domain)}</span> · ${new Date().toLocaleDateString('de-DE')}</p>
<h2>Kurzfassung</h2><ul>${(p.offer?.painPoints||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
<h2>Unternehmen & Kontakt</h2>
<table><tr><th>Firma</th><td>${esc(p.company?.name)}</td></tr>
<tr><th>GF</th><td>${esc(p.company?.managingDirector)}</td></tr>
<tr><th>E-Mail</th><td>${esc(p.contacts?.preferredEmail)}</td></tr>
<tr><th>Ort</th><td>${esc(p.company?.postalCode)} ${esc(p.company?.city)}</td></tr></table>
<h2>Google-Unternehmensprofil</h2>
${p.googleBusiness?.found ? `<table>
<tr><th>Profil</th><td>${esc(p.googleBusiness.name)}</td></tr>
<tr><th>Adresse</th><td>${esc(p.googleBusiness.address)}</td></tr>
<tr><th>Telefon</th><td>${esc(p.googleBusiness.phone)}</td></tr>
<tr><th>Bewertung</th><td>${p.googleBusiness.rating} ⭐ (${p.googleBusiness.reviewCount} Rezensionen)</td></tr>
<tr><th>Vollständigkeit</th><td>${p.googleBusiness.completenessScore}%</td></tr>
<tr><th>Fotos</th><td>${p.googleBusiness.photoCount ?? '–'}</td></tr>
<tr><th>Maps</th><td>${esc(p.googleBusiness.mapsUrl)}</td></tr></table>
<ul>${(p.googleBusiness.gaps||[]).map(g=>`<li class="warn">${esc(g)}</li>`).join('')}</ul>` : '<p class="warn">Kein Google-Unternehmensprofil auffindbar – große Chance für lokalen GMB-Komplettservice und mehr Sichtbarkeit in Maps.</p>'}
<h2>Technologie</h2><table>
<tr><th>Plattform</th><td>${esc(p.technology?.platform)} (${Math.round((p.technology?.confidence||0)*100)}%)</td></tr>
<tr><th>Baukasten</th><td>${p.technology?.isPageBuilder ? 'Ja' : 'Nein'}</td></tr></table>
<p>${esc(p.technology?.recommendation)}</p>
<h2>Performance</h2><table>
<tr><th>Mobile</th><td>${p.performance?.mobileScore ?? '–'}</td></tr>
<tr><th>Desktop</th><td>${p.performance?.desktopScore ?? '–'}</td></tr>
<tr><th>LCP</th><td>${esc(p.performance?.lcp)}</td></tr></table>
<h2>SEO</h2><p><strong>Title:</strong> ${esc(p.seo?.title)}</p><p><strong>Meta:</strong> ${esc(p.seo?.metaDescription)}</p>
<h2>Empfehlung WebWelle</h2>
${n8nOfferPdfBlock(p)}
<p>${esc($env.OUTBOUND_ZOOM_URL || 'https://webwelle.com')}</p>
<p style="margin-top:48px;color:#64748b;font-size:12px;">WebWelle · AeManie GmbH · webwelle.com</p>
</body></html>`;
}

// --- Main ---
try {
const rawItem = items[0].json;
const body = rawItem.body && typeof rawItem.body === 'object' ? rawItem.body : rawItem;
const websiteUrl = normalizeUrl(body.websiteUrl);
if (!websiteUrl) throw new Error('websiteUrl fehlt');

const store = storeApi();
const prospectId = body.prospectId || `ob_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const domain = domainFromUrl(websiteUrl);

store.save(prospectId, { id: prospectId, websiteUrl, domain, status: 'analyzing', googleMapsUrl: body.googleMapsUrl || '' });

const homeHtml = await fetchHtml(websiteUrl);
const IMPRESSUM_PATHS = ['/impressum', '/impressum.html', '/legal', '/rechtliches', '/kontakt', '/contact'];
let impressumHtml = '';
for (const path of IMPRESSUM_PATHS) {
  const h = await fetchHtml(joinUrl(websiteUrl, path));
  if (h.length > 200 && /impressum|§\s*5|geschäftsführer|vertreten durch|anschrift/i.test(h)) {
    impressumHtml = h;
    break;
  }
}
if (!impressumHtml) {
  for (const path of IMPRESSUM_PATHS) {
    const h = await fetchHtml(joinUrl(websiteUrl, path));
    if (h.length > 200) { impressumHtml = h; break; }
  }
}

const companyRaw = await impressumExtract({ impressumHtml, homeHtml, domain });
const technology = detectTech(homeHtml);
const seo = seoFromHtml(homeHtml);
const [mobilePs, desktopPs] = await Promise.all([pageSpeed(websiteUrl, 'mobile'), pageSpeed(websiteUrl, 'desktop')]);
const performance = { mobileScore: mobilePs.score, desktopScore: desktopPs.score, lcp: mobilePs.lcp, cls: mobilePs.cls, issues: [] };
const conversion = { hasContactForm: /<form/i.test(homeHtml), hasTelLink: /tel:/i.test(homeHtml) };
const legal = {
  impressumComplete: /impressum|§\s*5/i.test(homeHtml + impressumHtml),
  privacyLinked: /datenschutz/i.test(homeHtml + impressumHtml),
  cookieBanner: /cookie|consent/i.test(homeHtml),
};

const googleBusiness = await gbpEnrich({
  domain,
  companyName: companyRaw.companyName,
  tradeName: companyRaw.tradeName,
  city: companyRaw.city,
  postalCode: companyRaw.postalCode,
  street: companyRaw.street,
  phones: companyRaw.phones,
  googleMapsUrl: body.googleMapsUrl,
});

const company = {
  name: companyRaw.companyName || domain,
  managingDirector: companyRaw.managingDirector || '',
  address: companyRaw.street || '',
  city: companyRaw.city || '',
  postalCode: companyRaw.postalCode || '',
  industryGuess: companyRaw.industryGuess || body.industryHint || '',
};
const emails = Array.isArray(companyRaw.emails) ? companyRaw.emails : [];
const contacts = {
  emails,
  phones: Array.isArray(companyRaw.phones) ? companyRaw.phones : [],
  preferredEmail: companyRaw.preferredEmail || emails.find((e) => /info@|kontakt@/i.test(e)) || emails[0] || '',
};

const audit = { company, contacts, technology, seo, performance, conversion, legal, googleBusiness, domain, designScore: technology.isPageBuilder ? 4 : 6 };
const painPoints = buildPainPoints(audit);
const offerScoring = scoreOffers(audit, painPoints);

const composeRaw = await openRouter([
  { role: 'system', content: 'Du bist WebWelle Vertriebstexter. Antworte nur JSON: { subject, greeting, benefits: string[3], alternativeLine?: string }' },
  { role: 'user', content: JSON.stringify({ domain, company, painPoints, primary: offerScoring.primary, gbp: googleBusiness }) },
]);
const composed = extractJson(composeRaw) || {};

const emailSubject = composed.subject || `Kurzanalyse ${domain} – 3 Hebel für mehr Anfragen`;
const benefits = composed.benefits || [
  'Professioneller Auftritt statt veralteter Baukasten-Lösung',
  'Bessere mobile Performance und klare Kontaktwege',
  'SEO- und Google-Grundlage für mehr lokale Sichtbarkeit',
];

// PDF wird im WebWelle-Admin serverseitig erzeugt – spart n8n-Speicher und Laufzeit.
const prospectDraft = {
  id: prospectId, websiteUrl, domain, status: 'draft',
  company, contacts, technology, seo, performance, conversion, legal, googleBusiness,
  offer: { ...offerScoring, painPoints, benefits, primaryLabel: N8N_PRODUCTS[offerScoring.primary]?.name || 'StarterWelle' },
  email: {
    subject: emailSubject,
    greeting: composed.greeting || (company.managingDirector ? `Sehr geehrter Herr ${company.managingDirector},` : 'Sehr geehrte Damen und Herren,'),
    benefits, alternativeLine: composed.alternativeLine || '',
  },
  editedByUser: false,
  sentAt: null,
};
prospectDraft.email.html = renderEmailHtml(prospectDraft);
store.save(prospectId, prospectDraft);

return [{ json: { ok: true, prospectId, status: 'draft', domain, preferredEmail: contacts.preferredEmail } }];
} catch (err) {
  throw new Error(`Outbound-Analyse fehlgeschlagen: ${err?.message || err}`);
}
