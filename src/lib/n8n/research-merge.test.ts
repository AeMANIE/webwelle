import test from 'node:test';
import assert from 'node:assert/strict';
import {
  domainsMatch,
  mergeCompetitorDesignPayload,
  mergeSeoKeywordsPayload,
} from './research-merge.ts';

test('mergeCompetitorDesignPayload prepends own site competitor', () => {
  const merged = mergeCompetitorDesignPayload(
    {
      competitors: [{ name: 'Konkurrent', websiteUrl: 'https://konkurrent.de', domain: 'konkurrent.de' }],
      summary: 'Alt',
    },
    {
      competitors: [{ name: 'Ihre Website', websiteUrl: 'https://www.kunde.de', domain: 'kunde.de' }],
      summary: 'Neu',
      isOwnSiteSupplement: true,
    },
    'https://www.kunde.de'
  );

  assert.equal(merged.competitors.length, 2);
  assert.equal((merged.competitors[0] as Record<string, unknown>).isOwnSite, true);
  assert.equal((merged.competitors[0] as Record<string, unknown>).domain, 'kunde.de');
  assert.equal(merged.ownSiteAnalyzed, true);
});

test('domainsMatch ignores www prefix', () => {
  assert.equal(domainsMatch('https://www.kunde.de', 'https://kunde.de/path'), true);
});

test('mergeSeoKeywordsPayload keeps own-site keywords first', () => {
  const merged = mergeSeoKeywordsPayload(
    {
      keywords: [{ keyword: 'konkurrent seo', cluster: 'wettbewerb' }],
      perSite: [{ domain: 'konkurrent.de', usedKeywords: ['foo'] }],
    },
    {
      keywords: [{ keyword: 'kunde seo', cluster: 'eigene-website' }],
      perSite: [{ domain: 'kunde.de', usedKeywords: ['bar'] }],
      isOwnSiteSupplement: true,
    },
    'kunde.de'
  );

  assert.equal((merged.keywords[0] as Record<string, unknown>).isOwnSite, true);
  assert.equal((merged.perSite[0] as Record<string, unknown>).domain, 'kunde.de');
});
