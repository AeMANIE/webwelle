import crypto from 'crypto';
import { pool } from './database';
import { BLOG_PIPELINE_MIGRATION_SQL } from './blog-pipeline-migration-sql';
import { BLOG_PROMPT_VERSION, FINAL_JOB_STATUSES, WEBWELLE_LEAD_TOKEN, type BlogPublishMode, type BlogSourceType } from './blog-constants';
import { stripUncontrolledImages } from './blog-guards';

export type BlogJobStatus =
  | 'queued'
  | 'running'
  | 'pipeline_finished'
  | 'awaiting_article_review'
  | 'ready_for_delivery'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'partial'; // legacy compat

export type BlogArticleStatus =
  | 'draft'
  | 'review_pending'
  | 'approved'
  | 'rejected'
  | 'failed';

export interface BlogJob {
  id: number;
  leadToken: string | null;
  customerId: string | null;
  sourceType: BlogSourceType;
  externalRunId: string;
  status: BlogJobStatus;
  keywordData: Record<string, unknown> | null;
  articleCount: number;
  completedCount: number;
  failedCount: number;
  publishMode: BlogPublishMode;
  promptVersion: string | null;
  n8nExecutionId: string | null;
  lastCallbackAt: Date | null;
  lastErrorAt: Date | null;
  pipelineFinishedAt: Date | null;
  deliveredAt: Date | null;
  statusChangedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface BlogArticle {
  id: number;
  jobId: number;
  leadToken: string | null;
  articleIndex: number;
  keyword: string;
  title: string | null;
  metaDesc: string | null;
  htmlContent: string | null;
  wordCount: number | null;
  status: BlogArticleStatus;
  qaStatus: string | null;
  qaFailReason: Record<string, unknown> | null;
  retryCount: number;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  internalNote: string | null;
  customerNote: string | null;
  customerVisibleAt: Date | null;
  copiedToProjectAt: Date | null;
  deliveryType: string | null;
  exportFormatLastUsed: string | null;
  targetProjectName: string | null;
  targetProjectUrl: string | null;
  targetCms: string | null;
  canonicalUrl: string | null;
  promptVersion: string | null;
  brandVoiceVersion: string | null;
  n8nExecutionId: string | null;
  lastErrorAt: Date | null;
  createdAt: Date;
}

export interface BlogJobWithMeta extends BlogJob {
  companyName: string | null;
  industry: string | null;
  articleRows: number;
}

export interface BlogImageInput {
  role: 'featured' | 'inline' | 'og';
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  storagePath?: string;
  blurDataUrl?: string;
  promptUsed?: string;
  position?: number;
}

function mapJob(row: Record<string, unknown>): BlogJob {
  return {
    id: Number(row.id),
    leadToken: (row.lead_token as string | null) || null,
    customerId: (row.customer_id as string | null) || null,
    sourceType: (row.source_type as BlogSourceType) || 'client',
    externalRunId: String(row.external_run_id || ''),
    status: row.status as BlogJobStatus,
    keywordData: (row.keyword_data as Record<string, unknown> | null) || null,
    articleCount: Number(row.article_count),
    completedCount: Number(row.completed_count),
    failedCount: Number(row.failed_count),
    publishMode: (row.publish_mode as BlogPublishMode) || 'draft',
    promptVersion: (row.prompt_version as string | null) || null,
    n8nExecutionId: (row.n8n_execution_id as string | null) || null,
    lastCallbackAt: row.last_callback_at ? new Date(row.last_callback_at as string) : null,
    lastErrorAt: row.last_error_at ? new Date(row.last_error_at as string) : null,
    pipelineFinishedAt: row.pipeline_finished_at ? new Date(row.pipeline_finished_at as string) : null,
    deliveredAt: row.delivered_at ? new Date(row.delivered_at as string) : null,
    statusChangedAt: row.status_changed_at ? new Date(row.status_changed_at as string) : null,
    startedAt: row.started_at ? new Date(row.started_at as string) : null,
    completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
    errorMessage: (row.error_message as string | null) || null,
    createdAt: new Date(row.created_at as string),
  };
}

function mapArticle(row: Record<string, unknown>): BlogArticle {
  return {
    id: Number(row.id),
    jobId: Number(row.job_id),
    leadToken: (row.lead_token as string | null) || null,
    articleIndex: Number(row.article_index),
    keyword: String(row.keyword),
    title: (row.title as string | null) || null,
    metaDesc: (row.meta_desc as string | null) || null,
    htmlContent: (row.html_content as string | null) || null,
    wordCount: row.word_count != null ? Number(row.word_count) : null,
    status: row.status as BlogArticleStatus,
    qaStatus: (row.qa_status as string | null) || null,
    qaFailReason: (row.qa_fail_reason as Record<string, unknown> | null) || null,
    retryCount: Number(row.retry_count ?? 0),
    approvedBy: (row.approved_by as string | null) || null,
    approvedAt: row.approved_at ? new Date(row.approved_at as string) : null,
    rejectedBy: (row.rejected_by as string | null) || null,
    rejectedAt: row.rejected_at ? new Date(row.rejected_at as string) : null,
    internalNote: (row.internal_note as string | null) || null,
    customerNote: (row.customer_note as string | null) || null,
    customerVisibleAt: row.customer_visible_at ? new Date(row.customer_visible_at as string) : null,
    copiedToProjectAt: row.copied_to_project_at ? new Date(row.copied_to_project_at as string) : null,
    deliveryType: (row.delivery_type as string | null) || null,
    exportFormatLastUsed: (row.export_format_last_used as string | null) || null,
    targetProjectName: (row.target_project_name as string | null) || null,
    targetProjectUrl: (row.target_project_url as string | null) || null,
    targetCms: (row.target_cms as string | null) || null,
    canonicalUrl: (row.canonical_url as string | null) || null,
    promptVersion: (row.prompt_version as string | null) || null,
    brandVoiceVersion: (row.brand_voice_version as string | null) || null,
    n8nExecutionId: (row.n8n_execution_id as string | null) || null,
    lastErrorAt: row.last_error_at ? new Date(row.last_error_at as string) : null,
    createdAt: new Date(row.created_at as string),
  };
}

export function buildExternalRunId(parts: {
  sourceType: BlogSourceType;
  leadToken?: string | null;
  keywords?: string[];
  retryCount?: number;
}): string {
  const base = [
    parts.sourceType,
    parts.leadToken || 'webwelle',
    (parts.keywords || []).join(',').slice(0, 200),
    new Date().toISOString().slice(0, 13),
  ].join('|');
  const hash = crypto.createHash('sha256').update(base).digest('hex').slice(0, 24);
  const suffix = parts.retryCount ? `-retry-${parts.retryCount}` : '';
  return `${parts.sourceType}-${hash}${suffix}`;
}

export function resolveBlogLeadToken(
  sourceType: BlogSourceType,
  leadToken?: string | null
): string | null {
  const trimmed = leadToken?.trim();
  if (trimmed) return trimmed;
  if (sourceType === 'webwelle') return WEBWELLE_LEAD_TOKEN;
  return null;
}

export async function ensureBlogPipelineTables(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(BLOG_PIPELINE_MIGRATION_SQL);
  } finally {
    client.release();
  }
}

export async function getBlogJobByExternalRunId(externalRunId: string): Promise<BlogJob | null> {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM blog_jobs WHERE external_run_id = $1', [
      externalRunId,
    ]);
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function getActiveBlogJobForLead(leadToken: string): Promise<BlogJob | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM blog_jobs
       WHERE lead_token = $1 AND status IN ('queued', 'running')
       ORDER BY created_at DESC LIMIT 1`,
      [leadToken]
    );
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function createBlogJob(params: {
  leadToken?: string | null;
  customerId?: string | null;
  articleCount: number;
  sourceType: BlogSourceType;
  externalRunId: string;
  publishMode?: BlogPublishMode;
  promptVersion?: string;
  keywordData?: Record<string, unknown> | null;
}): Promise<BlogJob> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO blog_jobs (
        lead_token, customer_id, article_count, status, source_type,
        external_run_id, publish_mode, prompt_version, keyword_data
      ) VALUES ($1, $2, $3, 'queued', $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        resolveBlogLeadToken(params.sourceType, params.leadToken),
        params.customerId || null,
        params.articleCount,
        params.sourceType,
        params.externalRunId,
        params.publishMode || 'draft',
        params.promptVersion || BLOG_PROMPT_VERSION,
        params.keywordData ? JSON.stringify(params.keywordData) : null,
      ]
    );
    return mapJob(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function markBlogJobRunning(jobId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE blog_jobs SET status = 'running', started_at = COALESCE(started_at, NOW()),
       status_changed_at = NOW() WHERE id = $1`,
      [jobId]
    );
  } finally {
    client.release();
  }
}

export async function getBlogJobById(jobId: number): Promise<BlogJob | null> {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM blog_jobs WHERE id = $1', [jobId]);
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

async function syncJobStatusFromArticles(jobId: number): Promise<void> {
  const client = await pool.connect();
  try {
    const job = await getBlogJobById(jobId);
    if (!job || FINAL_JOB_STATUSES.has(job.status)) return;

    const arts = await client.query(
      `SELECT status, COUNT(*)::int AS cnt FROM blog_articles WHERE job_id = $1 GROUP BY status`,
      [jobId]
    );
    const counts: Record<string, number> = {};
    for (const row of arts.rows) counts[String(row.status)] = Number(row.cnt);

    const reviewPending = counts.review_pending || 0;
    const approved = counts.approved || 0;
    const failed = counts.failed || 0;
    const totalDone = (job.completedCount || 0) + (job.failedCount || 0);

    let newStatus: BlogJobStatus = job.status;

    if (job.status === 'pipeline_finished' || job.status === 'running') {
      if (reviewPending > 0) newStatus = 'awaiting_article_review';
      else if (totalDone >= job.articleCount && approved > 0 && reviewPending === 0) {
        const nonTerminal = (counts.draft || 0) + reviewPending;
        if (nonTerminal === 0 && approved === totalDone - failed) {
          newStatus = 'ready_for_delivery';
        }
      }
    } else if (job.status === 'awaiting_article_review') {
      if (reviewPending === 0 && approved > 0) newStatus = 'ready_for_delivery';
    }

    if (newStatus !== job.status) {
      await client.query(
        `UPDATE blog_jobs SET status = $2, status_changed_at = NOW() WHERE id = $1`,
        [jobId, newStatus]
      );
    }
  } finally {
    client.release();
  }
}

export async function upsertBlogArticle(params: {
  jobId: number;
  leadToken?: string | null;
  articleIndex: number;
  keyword: string;
  title?: string | null;
  metaDesc?: string | null;
  htmlContent?: string | null;
  wordCount?: number | null;
  qaStatus?: string | null;
  qaFailReason?: Record<string, unknown> | null;
  promptVersion?: string | null;
  n8nExecutionId?: string | null;
}): Promise<BlogArticle> {
  const client = await pool.connect();
  try {
    const failed = params.qaStatus === 'failed';
    const status: BlogArticleStatus = failed ? 'failed' : 'review_pending';
    const cleanHtml = params.htmlContent ? stripUncontrolledImages(params.htmlContent) : null;

    const result = await client.query(
      `INSERT INTO blog_articles (
        job_id, lead_token, article_index, keyword, title, meta_desc,
        html_content, word_count, status, qa_status, qa_fail_reason,
        prompt_version, n8n_execution_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (job_id, article_index) DO UPDATE SET
        keyword = EXCLUDED.keyword,
        title = COALESCE(EXCLUDED.title, blog_articles.title),
        meta_desc = COALESCE(EXCLUDED.meta_desc, blog_articles.meta_desc),
        html_content = COALESCE(EXCLUDED.html_content, blog_articles.html_content),
        word_count = COALESCE(EXCLUDED.word_count, blog_articles.word_count),
        status = EXCLUDED.status,
        qa_status = EXCLUDED.qa_status,
        qa_fail_reason = EXCLUDED.qa_fail_reason,
        prompt_version = COALESCE(EXCLUDED.prompt_version, blog_articles.prompt_version),
        n8n_execution_id = COALESCE(EXCLUDED.n8n_execution_id, blog_articles.n8n_execution_id)
      RETURNING *`,
      [
        params.jobId,
        params.leadToken || null,
        params.articleIndex,
        params.keyword,
        params.title || null,
        params.metaDesc || null,
        cleanHtml,
        params.wordCount ?? null,
        status,
        params.qaStatus || null,
        params.qaFailReason ? JSON.stringify(params.qaFailReason) : null,
        params.promptVersion || BLOG_PROMPT_VERSION,
        params.n8nExecutionId || null,
      ]
    );

    await client.query(
      `UPDATE blog_jobs SET last_callback_at = NOW() WHERE id = $1`,
      [params.jobId]
    );

    await syncJobStatusFromArticles(params.jobId);
    return mapArticle(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function incrementBlogJobProgress(
  jobId: number,
  options: { failed?: boolean }
): Promise<BlogJob | null> {
  const client = await pool.connect();
  try {
    const col = options.failed ? 'failed_count' : 'completed_count';
    const result = await client.query(
      `UPDATE blog_jobs SET ${col} = ${col} + 1, last_callback_at = NOW() WHERE id = $1 RETURNING *`,
      [jobId]
    );
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

/** Pipeline technically finished — NOT customer delivery */
export async function markPipelineFinished(
  jobId: number,
  params: { failedCount?: number; n8nExecutionId?: string }
): Promise<BlogJob | null> {
  const client = await pool.connect();
  try {
    const job = await getBlogJobById(jobId);
    if (!job) return null;

    if (FINAL_JOB_STATUSES.has(job.status)) {
      return job;
    }

    if (params.failedCount != null && params.failedCount !== job.failedCount) {
      await client.query('UPDATE blog_jobs SET failed_count = $2 WHERE id = $1', [
        jobId,
        params.failedCount,
      ]);
    }

    const refreshed = await getBlogJobById(jobId);
    if (!refreshed) return null;

    let status: BlogJobStatus = 'pipeline_finished';
    if (refreshed.failedCount > 0 && refreshed.completedCount === 0) {
      status = 'failed';
    }

    const result = await client.query(
      `UPDATE blog_jobs SET
        status = $2,
        pipeline_finished_at = NOW(),
        status_changed_at = NOW(),
        n8n_execution_id = COALESCE($3, n8n_execution_id)
       WHERE id = $1 RETURNING *`,
      [jobId, status, params.n8nExecutionId || null]
    );

    await syncJobStatusFromArticles(jobId);
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function approveBlogArticle(params: {
  articleId: number;
  approvedBy: string;
  customerNote?: string | null;
}): Promise<BlogArticle | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE blog_articles SET
        status = 'approved',
        approved_by = $2,
        approved_at = NOW(),
        customer_note = COALESCE($3, customer_note)
       WHERE id = $1 AND status IN ('review_pending', 'draft')
       RETURNING *`,
      [params.articleId, params.approvedBy, params.customerNote || null]
    );
    if (!result.rows[0]) return null;
    const article = mapArticle(result.rows[0]);
    await syncJobStatusFromArticles(article.jobId);
    return article;
  } finally {
    client.release();
  }
}

export async function rejectBlogArticle(params: {
  articleId: number;
  rejectedBy: string;
  internalNote?: string | null;
}): Promise<BlogArticle | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE blog_articles SET
        status = 'rejected',
        rejected_by = $2,
        rejected_at = NOW(),
        internal_note = COALESCE($3, internal_note)
       WHERE id = $1 AND status IN ('review_pending', 'draft', 'approved')
       RETURNING *`,
      [params.articleId, params.rejectedBy, params.internalNote || null]
    );
    if (!result.rows[0]) return null;
    const article = mapArticle(result.rows[0]);
    await syncJobStatusFromArticles(article.jobId);
    return article;
  } finally {
    client.release();
  }
}

export async function deliverJobToCustomer(jobId: number): Promise<BlogJob | null> {
  const client = await pool.connect();
  try {
    const job = await getBlogJobById(jobId);
    if (!job || job.sourceType !== 'client') return null;
    if (job.status !== 'ready_for_delivery' && job.status !== 'pipeline_finished') {
      return null;
    }

    await client.query(
      `UPDATE blog_articles SET customer_visible_at = NOW()
       WHERE job_id = $1 AND status = 'approved' AND customer_visible_at IS NULL`,
      [jobId]
    );

    const result = await client.query(
      `UPDATE blog_jobs SET
        status = 'completed',
        delivered_at = NOW(),
        completed_at = NOW(),
        status_changed_at = NOW()
       WHERE id = $1 RETURNING *`,
      [jobId]
    );
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function exportBlogArticle(params: {
  articleId: number;
  deliveryType: string;
  exportFormat: string;
  targetProjectName?: string | null;
  targetProjectUrl?: string | null;
  targetCms?: string | null;
  canonicalUrl?: string | null;
}): Promise<BlogArticle | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE blog_articles SET
        copied_to_project_at = NOW(),
        delivery_type = $2,
        export_format_last_used = $3,
        target_project_name = COALESCE($4, target_project_name),
        target_project_url = COALESCE($5, target_project_url),
        target_cms = COALESCE($6, target_cms),
        canonical_url = COALESCE($7, canonical_url)
       WHERE id = $1 RETURNING *`,
      [
        params.articleId,
        params.deliveryType,
        params.exportFormat,
        params.targetProjectName || null,
        params.targetProjectUrl || null,
        params.targetCms || null,
        params.canonicalUrl || null,
      ]
    );
    return result.rows[0] ? mapArticle(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function getBlogArticleById(articleId: number): Promise<BlogArticle | null> {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM blog_articles WHERE id = $1', [articleId]);
    return result.rows[0] ? mapArticle(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function incrementArticleRetry(articleId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE blog_articles SET retry_count = retry_count + 1, status = 'draft', last_error_at = NOW()
       WHERE id = $1`,
      [articleId]
    );
  } finally {
    client.release();
  }
}

export async function listBlogJobs(limit = 50, sourceType?: BlogSourceType): Promise<BlogJobWithMeta[]> {
  const client = await pool.connect();
  try {
    const params: unknown[] = [limit];
    let where = '';
    if (sourceType) {
      where = 'WHERE j.source_type = $2';
      params.push(sourceType);
    }
    const result = await client.query(
      `SELECT j.*,
              fl.company_name,
              fl.industry_normalized,
              (SELECT COUNT(*)::int FROM blog_articles a WHERE a.job_id = j.id) AS article_rows
       FROM blog_jobs j
       LEFT JOIN funnel_leads fl ON fl.token = j.lead_token
       ${where}
       ORDER BY j.created_at DESC
       LIMIT $1`,
      params
    );
    return result.rows.map((row) => ({
      ...mapJob(row),
      companyName: (row.company_name as string | null) || null,
      industry: (row.industry_normalized as string | null) || null,
      articleRows: Number(row.article_rows),
    }));
  } finally {
    client.release();
  }
}

export async function getBlogArticlesByJobId(jobId: number): Promise<BlogArticle[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM blog_articles WHERE job_id = $1 ORDER BY article_index',
      [jobId]
    );
    return result.rows.map(mapArticle);
  } finally {
    client.release();
  }
}

export async function getCustomerVisibleArticles(customerId: string): Promise<BlogArticle[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT a.* FROM blog_articles a
       JOIN blog_jobs j ON j.id = a.job_id
       WHERE j.customer_id = $1 AND a.customer_visible_at IS NOT NULL
       ORDER BY a.customer_visible_at DESC`,
      [customerId]
    );
    return result.rows.map(mapArticle);
  } finally {
    client.release();
  }
}

export async function customerHasBlogJobs(customerId: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT 1 FROM blog_jobs WHERE customer_id = $1 LIMIT 1`,
      [customerId]
    );
    return result.rows.length > 0;
  } finally {
    client.release();
  }
}

export async function saveArticleImages(
  articleId: number,
  sourceSystem: BlogSourceType,
  images: BlogImageInput[]
): Promise<void> {
  if (!images.length) return;
  const client = await pool.connect();
  try {
    for (const img of images) {
      await client.query(
        `INSERT INTO blog_images (
          article_id, source_system, image_role, position, file_url, file_path,
          alt_text, caption, width, height, mime_type, blur_data_url, prompt_used,
          file_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          articleId,
          sourceSystem,
          img.role,
          img.position ?? 0,
          img.url,
          img.storagePath || img.url,
          img.alt || null,
          img.caption || null,
          img.width ?? null,
          img.height ?? null,
          img.mimeType || null,
          img.blurDataUrl || null,
          img.promptUsed || null,
          img.url.split('/').pop() || 'image',
        ]
      );
    }
  } finally {
    client.release();
  }
}

export async function savePostImages(
  postId: string,
  images: BlogImageInput[]
): Promise<void> {
  if (!images.length) return;
  const client = await pool.connect();
  try {
    for (const img of images) {
      await client.query(
        `INSERT INTO blog_images (
          post_id, source_system, image_role, position, file_url, file_path,
          alt_text, caption, width, height, mime_type, blur_data_url, prompt_used,
          file_name, is_featured
        ) VALUES ($1, 'webwelle', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          postId,
          img.role,
          img.position ?? 0,
          img.url,
          img.storagePath || img.url,
          img.alt || null,
          img.caption || null,
          img.width ?? null,
          img.height ?? null,
          img.mimeType || null,
          img.blurDataUrl || null,
          img.promptUsed || null,
          img.url.split('/').pop() || 'image',
          img.role === 'featured',
        ]
      );
    }
  } finally {
    client.release();
  }
}

export async function getImagesForPost(postId: string): Promise<BlogImageInput[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM blog_images WHERE COALESCE(post_id, blog_post_id) = $1 ORDER BY position`,
      [postId]
    );
    return result.rows.map((row) => ({
      role: (row.image_role || 'featured') as BlogImageInput['role'],
      url: row.file_url,
      alt: row.alt_text,
      caption: row.caption,
      width: row.width,
      height: row.height,
      mimeType: row.mime_type,
      storagePath: row.file_path,
      blurDataUrl: row.blur_data_url,
      promptUsed: row.prompt_used,
      position: row.position,
    }));
  } finally {
    client.release();
  }
}

export async function updateBlogJobKeywordData(
  jobId: number,
  keywordData: Record<string, unknown>
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('UPDATE blog_jobs SET keyword_data = $2 WHERE id = $1', [
      jobId,
      JSON.stringify(keywordData),
    ]);
  } finally {
    client.release();
  }
}

/** @deprecated use markPipelineFinished */
export async function finalizeBlogJob(
  jobId: number,
  params: { failedCount?: number }
): Promise<BlogJob | null> {
  return markPipelineFinished(jobId, params);
}
