import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clampDesignScore, clampReceivedSites, sanitizeCustomerErrorMessage } from './analysis-sanitize';
import { resolveAnalysisLoadState } from './analysis-state';
import { mapCustomerAnalysisViewModel } from './map-customer-analysis';
import { parseResearchData } from './parse-research';

describe('analysis-sanitize', () => {
  it('clamps design scores to 0-5', () => {
    assert.equal(clampDesignScore(8), 5);
    assert.equal(clampDesignScore(-1), 0);
    assert.equal(clampDesignScore(3.2), 3.2);
  });

  it('clamps received sites to target max', () => {
    assert.equal(clampReceivedSites(6), 5);
    assert.equal(clampReceivedSites(-2), 0);
  });

  it('abstracts technical errors for customers', () => {
    assert.match(
      sanitizeCustomerErrorMessage('Request failed with status code 400')!,
      /konnten derzeit nicht/
    );
  });
});

describe('analysis-state', () => {
  it('returns ready when core workflows are done', () => {
    const research = [
      { workflow_key: 'industry_questions', status: 'done', payload: {}, updated_at: '' },
      { workflow_key: 'seo_keywords', status: 'done', payload: {}, updated_at: '' },
      { workflow_key: 'competitor_design', status: 'done', payload: {}, updated_at: '' },
    ];
    assert.equal(
      resolveAnalysisLoadState({ research, pollCount: 1, maxPolls: 60 }),
      'ready'
    );
  });

  it('returns partial-ready when some data exists but not complete', () => {
    const research = [
      { workflow_key: 'seo_keywords', status: 'done', payload: { keywords: [] }, updated_at: '' },
      { workflow_key: 'competitor_design', status: 'pending', payload: null, updated_at: '' },
    ];
    assert.equal(
      resolveAnalysisLoadState({ research, pollCount: 2, maxPolls: 60 }),
      'partial-ready'
    );
  });
});

describe('mapCustomerAnalysisViewModel', () => {
  it('builds summary cards from research payloads', () => {
    const vm = mapCustomerAnalysisViewModel({
      lead: {
        industry_normalized: 'Psychotherapie',
        postal_code: '87437',
        city: 'Kempten',
        market: 'DE',
        existing_website: false,
      },
      research: [
        {
          workflow_key: 'seo_keywords',
          status: 'done',
          payload: {
            keywords: [{ keyword: 'Therapie Kempten' }],
            gaps: ['Online-Termin'],
          },
          updated_at: '2026-01-01T12:00:00Z',
        },
        {
          workflow_key: 'industry_questions',
          status: 'done',
          payload: { reasoning: 'Klarer Auftritt empfohlen.', complexityScore: 4 },
          updated_at: '2026-01-01T12:00:00Z',
        },
        {
          workflow_key: 'competitor_design',
          status: 'done',
          payload: {
            competitors: [{ name: 'Praxis A', designScore: 4, strengths: ['Klare Navigation'] }],
          },
          updated_at: '2026-01-01T12:00:00Z',
        },
      ],
    });

    assert.equal(vm.header.industry, 'Psychotherapie');
    assert.equal(vm.summaryCards.length, 4);
    assert.ok(vm.topKeywords.includes('Therapie Kempten'));
    assert.ok(vm.parsed.receivedSites <= 5);
    assert.match(vm.recommendationSummary, /Für Ihre Praxis empfiehlt sich/);
    assert.equal(vm.summaryCards[3]?.highlights[0], 'StarterWelle als starke Basis');
    assert.notEqual(vm.recommendationSummary, 'Klarer Auftritt empfohlen.');
  });

  it('shows all recommendation bullets for higher complexity', () => {
    const vm = mapCustomerAnalysisViewModel({
      lead: {
        industry_normalized: 'Rechtsanwalt',
        postal_code: '80331',
        city: 'München',
        market: 'DE',
      },
      research: [
        {
          workflow_key: 'industry_questions',
          status: 'done',
          payload: {
            reasoning: 'Die Vielzahl an Wettbewerbern…',
            complexityScore: 8,
            recommendation: 'individual_offer',
          },
          updated_at: '2026-01-01T12:00:00Z',
        },
      ],
    });

    assert.match(vm.recommendationSummary, /Für Ihre Kanzlei empfiehlt sich/);
    assert.deepEqual(vm.summaryCards[3]?.highlights, [
      'StarterWelle als starke Basis',
      'Sinnvolle Erweiterungen für mehr Sichtbarkeit',
      'Individuelles Angebot bei größerem Umfang',
    ]);
  });

  it('builds performance summary card with dynamic mobile scores', () => {
    const vm = mapCustomerAnalysisViewModel({
      lead: {
        industry_normalized: 'Rechtsanwalt',
        postal_code: '87437',
        city: 'Kempten',
        market: 'DE',
        existing_website: true,
        existing_website_url: 'https://www.meine-kanzlei.de',
      },
      research: [
        {
          workflow_key: 'site_performance',
          status: 'done',
          payload: {
            sites: [
              {
                name: 'Eigene Kanzlei',
                websiteUrl: 'https://www.meine-kanzlei.de',
                mobileScore: 58,
              },
              {
                name: 'Konkurrent A',
                websiteUrl: 'https://www.konkurrent.de',
                mobileScore: 94,
              },
              {
                name: 'Konkurrent B',
                websiteUrl: 'https://www.andere-kanzlei.de',
                mobileScore: 72,
              },
            ],
          },
          updated_at: '2026-01-01T12:00:00Z',
        },
      ],
    });

    const performanceCard = vm.summaryCards.find((card) => card.id === 'performance');
    assert.ok(performanceCard);
    assert.equal(performanceCard?.title, 'Performance');
    assert.equal(performanceCard?.tab, 'performance');
    assert.equal(performanceCard?.ctaLabel, 'Performance ansehen');
    assert.deepEqual(performanceCard?.highlights, [
      'Eigene Website: 58 Mobil',
      'Beste Vergleichswebsite: 94 Mobil',
      'Technische Basis in StarterWelle enthalten',
    ]);
  });
});
