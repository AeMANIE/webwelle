/**
 * Tech stack detection from HTML + headers.
 * Returns { platform, confidence, signals, isPageBuilder, recommendation }
 */
function detectTechnology(html, url) {
  const h = String(html || '').toLowerCase();
  const signals = [];
  const rules = [
    { platform: 'WordPress', patterns: ['wp-content', 'wp-includes', '/wp-json'], builder: true },
    { platform: 'Wix', patterns: ['wix.com', 'x-wix', 'static.wixstatic'], builder: true },
    { platform: 'Shopify', patterns: ['cdn.shopify.com', 'shopify.theme', 'myshopify.com'], builder: true },
    { platform: 'Jimdo', patterns: ['jimdo.com', 'jimstatic'], builder: true },
    { platform: 'Strato', patterns: ['strato.de', 'strato-hosting'], builder: true },
    { platform: 'Webflow', patterns: ['webflow.com', 'data-wf-page'], builder: true },
    { platform: 'Squarespace', patterns: ['squarespace.com', 'static.squarespace'], builder: true },
    { platform: 'TYPO3', patterns: ['typo3', 't3lib'], builder: false },
    { platform: 'Joomla', patterns: ['/media/system/js/', 'joomla'], builder: false },
    { platform: 'Next.js / React', patterns: ['__next_data__', '/_next/static', 'react-root'], builder: false },
  ];
  let best = { platform: 'Unbekannt / Custom', confidence: 0.3, signals: [], isPageBuilder: false };
  for (const rule of rules) {
    const matched = rule.patterns.filter((p) => h.includes(p));
    if (matched.length > best.signals.length || (matched.length && matched.length >= best.signals.length)) {
      const conf = Math.min(0.98, 0.5 + matched.length * 0.15);
      if (conf >= best.confidence) {
        best = {
          platform: rule.platform,
          confidence: conf,
          signals: matched,
          isPageBuilder: rule.builder,
        };
      }
    }
  }
  signals.push(...best.signals);
  let recommendation = 'Moderne, wartungsarme Umsetzung prüfen.';
  if (best.isPageBuilder) {
    recommendation = 'StarterWelle: professioneller React-Auftritt statt Baukasten-Limitierungen.';
  } else if (best.platform.includes('React')) {
    recommendation = 'Technisch solide Basis – Optimierung bei Conversion und SEO möglich.';
  }
  return { ...best, recommendation };
}

function extractSeoMeta(html) {
  const h = String(html || '');
  const title = (h.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim() || '';
  const metaDesc = (h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i) || [])[1]?.trim() || '';
  const h1 = (h.match(/<h1[^>]*>([^<]*)<\/h1>/i) || [])[1]?.replace(/<[^>]+>/g, '').trim() || '';
  const canonical = (h.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i) || [])[1] || '';
  const robots = (h.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i) || [])[1] || '';
  return {
    title,
    metaDescription: metaDesc,
    h1,
    canonical,
    robots,
    titleOk: title.length >= 20 && title.length <= 65,
    metaOk: metaDesc.length >= 70 && metaDesc.length <= 160,
    gaps: [
      ...(title.length < 20 ? ['Seitentitel zu kurz oder fehlt'] : []),
      ...(metaDesc.length < 50 ? ['Meta-Beschreibung fehlt oder zu kurz'] : []),
      ...(!h1 ? ['Keine klare H1-Überschrift'] : []),
    ],
  };
}

function extractConversionSignals(html) {
  const h = String(html || '').toLowerCase();
  return {
    hasContactForm: /<form[\s>]/i.test(html) && /kontakt|contact|anfrage|mail/i.test(h),
    hasTelLink: /href=["']tel:/i.test(html),
    hasMailLink: /href=["']mailto:/i.test(html),
    ctaKeywords: ['kontakt', 'anfrage', 'termin', 'angebot'].filter((k) => h.includes(k)),
  };
}

function extractLegalSignals(html, impressumHtml) {
  const combined = (html + impressumHtml).toLowerCase();
  return {
    impressumComplete: /impressum|§\s*5\s*tmg|angaben\s+gemäß/i.test(combined),
    privacyLinked: /datenschutz|privacy/i.test(combined),
    cookieBanner: /cookie|consent|borlabs|usercentrics|klaro/i.test(combined),
  };
}

const IMPRESSUM_PATHS = ['/impressum', '/impressum.html', '/legal', '/kontakt', '/contact', '/datenschutz'];

module.exports = { detectTechnology, extractSeoMeta, extractConversionSignals, extractLegalSignals, IMPRESSUM_PATHS };
