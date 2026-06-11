import { pool } from './database';

export type BlogJobStatus = 'queued' | 'running' | 'partial' | 'completed' | 'failed';

export type BlogArticleStatus =
  | 'draft'
  | 'review_pending'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'failed';

export interface BlogJob {
  id: number;
  leadToken: string;
  customerId: string | null;
  status: BlogJobStatus;
  keywordData: Record<string, unknown> | null;
  articleCount: number;
  completedCount: number;
  failedCount: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

export interface BlogArticle {
  id: number;
  jobId: number;
  leadToken: string;
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
  createdAt: Date;
}

export interface BlogJobWithMeta extends BlogJob {
  companyName: string | null;
  industry: string | null;
  articleRows: number;
}

function mapJob(row: Record<string, unknown>): BlogJob {
  return {
    id: Number(row.id),
    leadToken: String(row.lead_token),
    customerId: (row.customer_id as string | null) || null,
    status: row.status as BlogJobStatus,
    keywordData: (row.keyword_data as Record<string, unknown> | null) || null,
    articleCount: Number(row.article_count),
    completedCount: Number(row.completed_count),
    failedCount: Number(row.failed_count),
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
    leadToken: String(row.lead_token),
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
    createdAt: new Date(row.created_at as string),
  };
}

export async function ensureBlogPipelineTables(): Promise<void> {
  const client = await pool.connect();
  try {
    const fs = await import('fs');
    const path = await import('path');
    const sqlPath = path.join(process.cwd(), 'info/database/blog_pipeline_tables.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await client.query(sql);
    }
  } catch (e) {
    console.warn('Blog pipeline tables migration:', e);
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
  leadToken: string;
  customerId?: string | null;
  articleCount: number;
}): Promise<BlogJob> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO blog_jobs (lead_token, customer_id, article_count, status)
       VALUES ($1, $2, $3, 'queued')
       RETURNING *`,
      [params.leadToken, params.customerId || null, params.articleCount]
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
      `UPDATE blog_jobs SET status = 'running', started_at = COALESCE(started_at, NOW())
       WHERE id = $1`,
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

export async function upsertBlogArticle(params: {
  jobId: number;
  leadToken: string;
  articleIndex: number;
  keyword: string;
  title?: string | null;
  metaDesc?: string | null;
  htmlContent?: string | null;
  wordCount?: number | null;
  qaStatus?: string | null;
  qaFailReason?: Record<string, unknown> | null;
}): Promise<BlogArticle> {
  const client = await pool.connect();
  try {
    const failed = params.qaStatus === 'failed';
    const result = await client.query(
      `INSERT INTO blog_articles (
        job_id, lead_token, article_index, keyword, title, meta_desc,
        html_content, word_count, status, qa_status, qa_fail_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (job_id, article_index) DO UPDATE SET
        keyword = EXCLUDED.keyword,
        title = EXCLUDED.title,
        meta_desc = EXCLUDED.meta_desc,
        html_content = EXCLUDED.html_content,
        word_count = EXCLUDED.word_count,
        status = EXCLUDED.status,
        qa_status = EXCLUDED.qa_status,
        qa_fail_reason = EXCLUDED.qa_fail_reason
      RETURNING *`,
      [
        params.jobId,
        params.leadToken,
        params.articleIndex,
        params.keyword,
        params.title || null,
        params.metaDesc || null,
        params.htmlContent || null,
        params.wordCount ?? null,
        failed ? 'failed' : 'draft',
        params.qaStatus || null,
        params.qaFailReason ? JSON.stringify(params.qaFailReason) : null,
      ]
    );
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
      `UPDATE blog_jobs SET ${col} = ${col} + 1 WHERE id = $1 RETURNING *`,
      [jobId]
    );
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function finalizeBlogJob(
  jobId: number,
  params: { failedCount?: number }
): Promise<BlogJob | null> {
  const client = await pool.connect();
  try {
    const job = await getBlogJobById(jobId);
    if (!job) return null;

    if (params.failedCount != null && params.failedCount !== job.failedCount) {
      await client.query('UPDATE blog_jobs SET failed_count = $2 WHERE id = $1', [
        jobId,
        params.failedCount,
      ]);
    }

    const refreshed = await getBlogJobById(jobId);
    if (!refreshed) return null;

    let status: BlogJobStatus = 'completed';
    if (refreshed.failedCount > 0 && refreshed.completedCount === 0) {
      status = 'failed';
    } else if (refreshed.failedCount > 0 || refreshed.completedCount < refreshed.articleCount) {
      status = 'partial';
    }

    const result = await client.query(
      `UPDATE blog_jobs SET status = $2, completed_at = NOW() WHERE id = $1 RETURNING *`,
      [jobId, status]
    );
    return result.rows[0] ? mapJob(result.rows[0]) : null;
  } finally {
    client.release();
  }
}

export async function listBlogJobs(limit = 50): Promise<BlogJobWithMeta[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT j.*,
              fl.company_name,
              fl.industry_normalized,
              (SELECT COUNT(*)::int FROM blog_articles a WHERE a.job_id = j.id) AS article_rows
       FROM blog_jobs j
       LEFT JOIN funnel_leads fl ON fl.token = j.lead_token
       ORDER BY j.created_at DESC
       LIMIT $1`,
      [limit]
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
