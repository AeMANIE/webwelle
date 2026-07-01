-- Outbound cold-prospecting prospects (Marketing tab)
CREATE TABLE IF NOT EXISTS outbound_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(64) UNIQUE NOT NULL,
  domain VARCHAR(255) NOT NULL,
  website_url TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'analyzing'
    CHECK (status IN ('analyzing', 'draft', 'sent', 'replied', 'lost', 'bounced')),
  company_name VARCHAR(255),
  preferred_email VARCHAR(255),
  city VARCHAR(128),
  postal_code VARCHAR(16),
  audit_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  email_draft JSONB,
  sent_at TIMESTAMPTZ,
  sent_to VARCHAR(255),
  sent_by_staff_id UUID,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  lead_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbound_prospects_domain ON outbound_prospects(domain);
CREATE INDEX IF NOT EXISTS idx_outbound_prospects_status ON outbound_prospects(status);
CREATE INDEX IF NOT EXISTS idx_outbound_prospects_sent_at ON outbound_prospects(sent_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_outbound_prospects_preferred_email ON outbound_prospects(preferred_email);
CREATE INDEX IF NOT EXISTS idx_outbound_prospects_created ON outbound_prospects(created_at DESC);
