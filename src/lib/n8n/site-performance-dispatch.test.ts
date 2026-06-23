import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sitePerformanceAlreadyStarted } from './site-performance-guard';

describe('sitePerformanceAlreadyStarted', () => {
  it('returns false when site_performance is missing', () => {
    assert.equal(sitePerformanceAlreadyStarted([]), false);
    assert.equal(
      sitePerformanceAlreadyStarted([{ workflow_key: 'seo_keywords', status: 'done', payload: {} }]),
      false
    );
  });

  it('returns true when site_performance is done', () => {
    assert.equal(
      sitePerformanceAlreadyStarted([
        { workflow_key: 'site_performance', status: 'done', payload: {} },
      ]),
      true
    );
  });

  it('returns true when callbacks already arrived', () => {
    assert.equal(
      sitePerformanceAlreadyStarted([
        {
          workflow_key: 'site_performance',
          status: 'partial',
          payload: { receivedSites: 2 },
        },
      ]),
      true
    );
  });

  it('returns true when dispatch marker is pending', () => {
    assert.equal(
      sitePerformanceAlreadyStarted([
        {
          workflow_key: 'site_performance',
          status: 'pending',
          payload: { dispatched: true, receivedSites: 0 },
        },
      ]),
      true
    );
  });

  it('returns false for stale error row without dispatch marker', () => {
    assert.equal(
      sitePerformanceAlreadyStarted([
        {
          workflow_key: 'site_performance',
          status: 'error',
          payload: { receivedSites: 0 },
        },
      ]),
      false
    );
  });
});
