import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIndustryForResearch,
  isGenericIndustry,
  leadRequiresIndustryDetail,
} from './industry';

describe('industry generic vs specific paths', () => {
  it('treats specific trades as non-generic without detail', () => {
    for (const name of ['Fliesenleger', 'Malerbetrieb', 'Physiotherapie']) {
      assert.equal(isGenericIndustry(name, name, null), false);
      assert.equal(
        leadRequiresIndustryDetail({
          industry_normalized: name,
          industry_raw: name,
          industry_detail: null,
        }),
        false
      );
    }
  });

  it('requires detail for generic industry until concrete detail is set', () => {
    assert.equal(isGenericIndustry('Handwerker', 'Handwerker', null), true);
    assert.equal(
      leadRequiresIndustryDetail({
        industry_normalized: 'Handwerker',
        industry_raw: 'Handwerker',
        industry_detail: null,
      }),
      true
    );

    assert.equal(isGenericIndustry('Handwerker', 'Handwerker', 'Fliesenleger'), false);
    assert.equal(
      leadRequiresIndustryDetail({
        industry_normalized: 'Handwerker',
        industry_raw: 'Handwerker',
        industry_detail: 'Fliesenleger',
      }),
      false
    );
  });

  it('buildIndustryForResearch combines base and detail or uses specific name alone', () => {
    assert.equal(
      buildIndustryForResearch('Handwerker', 'Fliesenleger', 'Handwerker'),
      'Handwerker – Fliesenleger'
    );
    assert.equal(buildIndustryForResearch('Fliesenleger', null, 'Fliesenleger'), 'Fliesenleger');
    assert.equal(buildIndustryForResearch('Malerbetrieb', null, 'Maler'), 'Malerbetrieb');
  });
});
