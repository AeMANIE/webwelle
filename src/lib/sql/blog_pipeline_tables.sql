-- Blog pipeline tables (System B) + extensions for v3 lifecycle
-- Deployed copy (info/database/ mirror) — loaded at runtime from src/lib/sql/

CREATE TABLE IF NOT EXISTS blog_jobs (
  id SERIAL PRIMARY KEY,
  lead_token VARCHAR(64),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  source_type VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (source_type IN ('webwelle', 'client')),
  external_run_id VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'queued',
  keyword_data JSONB,
  article_count INT NOT NULL DEFAULT 10,
  completed_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  publish_mode VARCHAR(20) DEFAULT 'draft' CHECK (publish_mode IN ('draft', 'publish')),
  prompt_version VARCHAR(64),
  n8n_execution_id TEXT,
  error_message TEXT,
  last_callback_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  pipeline_finished_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_articles (
  id SERIAL PRIMARY KEY,
  job_id INT NOT NULL REFERENCES blog_jobs(id) ON DELETE CASCADE,
  lead_token VARCHAR(64),
  article_index INT NOT NULL,
  keyword VARCHAR(500) NOT NULL,
  title TEXT,
  meta_desc TEXT,
  html_content TEXT,
  word_count INT,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  qa_status VARCHAR(32),
  qa_fail_reason JSONB,
  retry_count INT NOT NULL DEFAULT 0,
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  rejected_by VARCHAR(255),
  rejected_at TIMESTAMPTZ,
  internal_note TEXT,
  customer_note TEXT,
  customer_visible_at TIMESTAMPTZ,
  copied_to_project_at TIMESTAMPTZ,
  delivery_type VARCHAR(32),
  export_format_last_used VARCHAR(32),
  target_project_name VARCHAR(255),
  target_project_url VARCHAR(500),
  target_cms VARCHAR(128),
  canonical_url VARCHAR(500),
  prompt_version VARCHAR(64),
  brand_voice_version VARCHAR(64),
  n8n_execution_id TEXT,
  last_error_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, article_index)
);

ALTER TABLE blog_jobs ALTER COLUMN lead_token DROP NOT NULL;
ALTER TABLE blog_articles ALTER COLUMN lead_token DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_jobs_lead_token ON blog_jobs(lead_token);
CREATE INDEX IF NOT EXISTS idx_blog_jobs_customer_id ON blog_jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_blog_jobs_status ON blog_jobs(status);
CREATE INDEX IF NOT EXISTS idx_blog_jobs_source_type ON blog_jobs(source_type);
CREATE INDEX IF NOT EXISTS idx_blog_articles_job_id ON blog_articles(job_id);
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_customer_visible ON blog_articles(customer_visible_at);

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS prompt_version VARCHAR(64);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS source_job_id INT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'blog_posts_source_job_id_fkey'
  ) THEN
    ALTER TABLE blog_posts
      ADD CONSTRAINT blog_posts_source_job_id_fkey
      FOREIGN KEY (source_job_id) REFERENCES blog_jobs(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'blog_images'
  ) THEN
    ALTER TABLE blog_images ADD COLUMN IF NOT EXISTS article_id INT;
    ALTER TABLE blog_images ADD COLUMN IF NOT EXISTS source_system VARCHAR(20) DEFAULT 'webwelle';
    ALTER TABLE blog_images ADD COLUMN IF NOT EXISTS image_role VARCHAR(20) DEFAULT 'featured';
    ALTER TABLE blog_images ADD COLUMN IF NOT EXISTS blur_data_url TEXT;
    ALTER TABLE blog_images ADD COLUMN IF NOT EXISTS prompt_used TEXT;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'blog_images' AND column_name = 'blog_post_id'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'blog_images' AND column_name = 'post_id'
    ) THEN
      ALTER TABLE blog_images RENAME COLUMN blog_post_id TO post_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'blog_images' AND column_name = 'post_id'
    ) THEN
      ALTER TABLE blog_images ADD COLUMN IF NOT EXISTS post_id UUID;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'blog_images'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_blog_images_article_id ON blog_images(article_id);
    CREATE INDEX IF NOT EXISTS idx_blog_images_source_system ON blog_images(source_system);
    CREATE INDEX IF NOT EXISTS idx_blog_images_image_role ON blog_images(image_role);
  END IF;
END $$;
