import { describe, expect, it } from 'vitest';
import {
  buildPipelineStepPatch,
  isSeoResearchOnlyJob,
  normalizeKeywordRecord,
  parseBlogJobKeywordData,
} from './blog-pipeline-keyword-data';

describe('blog-pipeline-keyword-data seo-admin', () => {
  it('builds seo01 patch with sourceType', () => {
    const patch = buildPipelineStepPatch('seo01', {
      sourceType: 'admin_research',
      raw_keywords: [{ keyword: 'test' }],
    });
    const seo01 = (patch.pipeline as Record<string, unknown>).seo01 as Record<string, unknown>;
    expect(seo01.sourceType).toBe('admin_research');
  });

  it('builds seo02 patch with skipped_keywords', () => {
    const patch = buildPipelineStepPatch('seo02', {
      approved_blog_keywords: [{ keyword: 'a' }],
      skipped_keywords: [{ keyword: 'b', status: 'skip' }],
      sourceType: 'admin_research',
    });
    const seo02 = (patch.pipeline as Record<string, unknown>).seo02 as Record<string, unknown>;
    expect(seo02.skipped_keywords).toHaveLength(1);
    expect(seo02.sourceType).toBe('admin_research');
  });

  it('detects seo_research_only jobs', () => {
    expect(isSeoResearchOnlyJob({ mode: 'seo_research_only' })).toBe(true);
    expect(isSeoResearchOnlyJob({ mode: 'other' })).toBe(false);
  });

  it('normalizes snake_case briefing fields', () => {
    const row = normalizeKeywordRecord({
      keyword: 'sanitär kempten',
      search_volume: 210,
      keyword_difficulty: 18,
      local_competitors: 2,
      top3_urls: 'https://a.de',
      avg_word_count: 1200,
      avg_h2_count: 6,
      keyword_cluster: 'tipps',
    });
    expect(row?.volume).toBe(210);
    expect(row?.localCompetitors).toBe(2);
    expect(row?.avgWordCount).toBe(1200);
  });

  it('parses skipped_keywords in seo02', () => {
    const view = parseBlogJobKeywordData({
      mode: 'seo_research_only',
      branche: 'Sanitär',
      plz: '87435',
      pipeline: {
        seo02: {
          skipped_keywords: [{ keyword: 'skip-me', status: 'skip' }],
        },
      },
    });
    expect(view.mode).toBe('seo_research_only');
    expect(view.pipeline?.seo02?.skipped_keywords).toHaveLength(1);
  });
});
