/** Versioned blog writing prompt – keep in sync with info/prompts/blogartikel-v1.txt */
export const BLOG_PROMPT_VERSION = 'blogartikel-v1';

export type BlogSourceType = 'webwelle' | 'client';

/** Sentinel for internal WebWelle jobs (no funnel lead); satisfies legacy NOT NULL on lead_token. */
export const WEBWELLE_LEAD_TOKEN = 'webwelle';

export type BlogPublishMode = 'draft' | 'publish';

export type BlogImageRole = 'featured' | 'inline' | 'og';

export type BlogDeliveryFormat = 'copy_html' | 'copy_plain' | 'export_json' | 'export_markdown';

export const FINAL_JOB_STATUSES = new Set(['completed', 'failed', 'cancelled']);

export const ACTIVE_JOB_STATUSES = new Set(['queued', 'running']);
