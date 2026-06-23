import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  customerVisibilityGaps,
  GENERIC_LOAD_FAILURE_MESSAGE,
  isTechnicalVisibilityGap,
} from './analysis-sanitize';

describe('visibility gap sanitization', () => {
  it('filters technical and generic load-failure gaps', () => {
    const gaps = customerVisibilityGaps([
      'KI-Keyword-Analyse nicht verfügbar (OpenRouter 402)',
      GENERIC_LOAD_FAILURE_MESSAGE,
      'Blog-Artikel zu lokalen Leistungen ausbauen',
      'Request failed with status code 500',
    ]);

    assert.deepEqual(gaps, ['Blog-Artikel zu lokalen Leistungen ausbauen']);
  });

  it('treats sanitized technical errors as non-customer gaps', () => {
    assert.equal(isTechnicalVisibilityGap(GENERIC_LOAD_FAILURE_MESSAGE), true);
    assert.equal(isTechnicalVisibilityGap('Lokale Landingpages für Fachleistungen'), false);
  });
});
