/** Versioned blog writing prompt – keep in sync with info/prompts/blogartikel-v1.txt */
export const BLOG_PROMPT_VERSION = 'blogartikel-v1';

export type BlogSourceType = 'webwelle' | 'client';

export type BlogPublishMode = 'draft' | 'publish';

export type BlogImageRole = 'featured' | 'inline' | 'og';

export type BlogDeliveryFormat = 'copy_html' | 'copy_plain' | 'export_json' | 'export_markdown';

export const FINAL_JOB_STATUSES = new Set(['completed', 'failed', 'cancelled']);

export const ACTIVE_JOB_STATUSES = new Set(['queued', 'running']);
