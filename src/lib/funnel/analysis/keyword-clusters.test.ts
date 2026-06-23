import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildKeywordClusterChartData,
  buildKeywordDetailsChartData,
  buildKeywordVolumeChartData,
  normalizeSeoKeywords,
} from './keyword-clusters';

describe('keyword-clusters', () => {
  it('expands nested cluster groups from n8n payload', () => {
    const keywords = normalizeSeoKeywords({
      clusters: [
        {
          name: 'Rechtsanwalt',
          keywords: [
            { keyword: 'Anwalt München', volume: 500 },
            { keyword: 'Rechtsberatung', volume: 300 },
          ],
        },
        {
          name: 'Scheidung',
          keywords: [{ keyword: 'Scheidungsanwalt', volume: 200 }],
        },
      ],
    });

    assert.equal(keywords.length, 3);
    assert.equal(keywords[0].cluster, 'Rechtsanwalt');
  });

  it('builds multiple pie slices from cluster groups', () => {
    const payload = {
      clusters: [
        { name: 'Rechtsanwalt', keywords: [{ keyword: 'a' }, { keyword: 'b' }] },
        { name: 'Scheidung', keywords: [{ keyword: 'c' }] },
      ],
    };
    const keywords = normalizeSeoKeywords(payload);
    const chart = buildKeywordClusterChartData(keywords, payload);

    assert.equal(chart.length, 2);
    assert.equal(chart[0].name, 'Rechtsanwalt');
    assert.equal(chart[0].value, 2);
  });

  it('falls back to top keywords when all share one cluster', () => {
    const keywords = [
      { keyword: 'Anwalt A', cluster: 'Rechtsanwalt', volume: 900 },
      { keyword: 'Anwalt B', cluster: 'Rechtsanwalt', volume: 400 },
      { keyword: 'Anwalt C', cluster: 'Rechtsanwalt', volume: 100 },
    ];
    const chart = buildKeywordClusterChartData(keywords, { keywords });

    assert.ok(chart.length > 1);
    assert.equal(chart[0].name, 'Anwalt A');
    assert.equal(chart[0].value, 900);
  });

  it('builds relevance fallback bars when search volume is missing', () => {
    const { rows, usesRelevanceFallback } = buildKeywordVolumeChartData([
      { keyword: 'Arztpraxis Kempten', volume: null },
      { keyword: 'Arztpraxis in der Nähe', volume: null },
      { keyword: 'praxis Arztpraxis', volume: null },
    ]);

    assert.equal(usesRelevanceFallback, true);
    assert.equal(rows.length, 3);
    assert.equal(rows[0].keyword, 'Arztpraxis Kempten');
    assert.equal(rows[0].volume, 1);
  });

  it('details chart lists individual keywords across multiple clusters', () => {
    const keywords = [
      { keyword: 'Arztpraxis Kempten', cluster: 'Kempten', volume: null },
      { keyword: 'Arztpraxis in der Nähe', cluster: 'lokal', volume: null },
      { keyword: 'praxis Arztpraxis', cluster: 'Kempten', volume: null },
      { keyword: 'kempten Arztpraxis', cluster: 'Kempten', volume: null },
    ];
    const { rows, usesRelevanceFallback } = buildKeywordDetailsChartData(keywords);

    assert.equal(usesRelevanceFallback, true);
    assert.equal(rows.length, 4);
    assert.equal(rows[0].cluster, 'Kempten');
    assert.equal(rows[1].cluster, 'lokal');
  });
});
