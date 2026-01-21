-- NPS Automation Schema
-- Database schema voor NPS Detractor Automation systeem

-- ============================================
-- TABLE: nps_responses
-- Opslag van alle NPS responses uit Beamer
-- ============================================
CREATE TABLE IF NOT EXISTS nps_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Data uit Beamer CSV
    cli_name TEXT NOT NULL,
    response_date DATE NOT NULL,
    week TEXT,
    user_email TEXT NOT NULL,
    user_first_name TEXT,
    user_last_name TEXT,
    feedback TEXT,
    score INTEGER NOT NULL,

    -- Metadata
    imported_at TIMESTAMP DEFAULT NOW(),
    imported_by UUID REFERENCES auth.users(id),
    is_detractor BOOLEAN GENERATED ALWAYS AS (score <= 6) STORED,
    is_passive BOOLEAN GENERATED ALWAYS AS (score >= 7 AND score <= 8) STORED,
    is_promoter BOOLEAN GENERATED ALWAYS AS (score >= 9) STORED,

    -- Constraints
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= 10),
    CONSTRAINT unique_response UNIQUE (user_email, response_date, cli_name)
);

-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS idx_nps_responses_detractors ON nps_responses(is_detractor) WHERE is_detractor = true;
CREATE INDEX IF NOT EXISTS idx_nps_responses_date ON nps_responses(response_date DESC);
CREATE INDEX IF NOT EXISTS idx_nps_responses_cli ON nps_responses(cli_name);

-- ============================================
-- TABLE: nps_outreach
-- Tracking van emails naar detractors
-- ============================================
CREATE TABLE IF NOT EXISTS nps_outreach (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nps_response_id UUID REFERENCES nps_responses(id) ON DELETE CASCADE,

    -- Email details
    sent_at TIMESTAMP,
    sent_from TEXT DEFAULT 'luuk.van.ravestein@timewax.com',
    sent_to TEXT NOT NULL,
    email_subject TEXT,
    email_body TEXT,

    -- Status tracking
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    resend_email_id TEXT, -- ID van Resend voor tracking
    error_message TEXT,

    -- Response tracking
    response_received_at TIMESTAMP,
    response_text TEXT,
    response_sentiment TEXT, -- 'positive', 'neutral', 'negative'
    response_summary TEXT,
    response_category TEXT, -- 'product', 'support', 'pricing', 'onboarding', etc.
    response_urgency TEXT, -- 'low', 'medium', 'high', 'critical'
    response_action_items JSONB,
    ai_analysis JSONB, -- Volledige AI analyse output

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    CONSTRAINT valid_sentiment CHECK (response_sentiment IS NULL OR response_sentiment IN ('positive', 'neutral', 'negative')),
    CONSTRAINT valid_urgency CHECK (response_urgency IS NULL OR response_urgency IN ('low', 'medium', 'high', 'critical'))
);

-- Index voor status tracking
CREATE INDEX IF NOT EXISTS idx_nps_outreach_status ON nps_outreach(status);
CREATE INDEX IF NOT EXISTS idx_nps_outreach_pending_response ON nps_outreach(response_received_at) WHERE response_received_at IS NULL AND status = 'sent';

-- ============================================
-- TABLE: csm_tasks
-- Task management voor CSM (vervangt Pipedrive)
-- ============================================
CREATE TABLE IF NOT EXISTS csm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nps_outreach_id UUID REFERENCES nps_outreach(id) ON DELETE SET NULL,

    -- Task details
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',

    -- Assignment
    assigned_to TEXT DEFAULT 'Luuk',
    due_date DATE,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled'))
);

-- Index voor task management
CREATE INDEX IF NOT EXISTS idx_csm_tasks_status ON csm_tasks(status) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_csm_tasks_due_date ON csm_tasks(due_date) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_csm_tasks_priority ON csm_tasks(priority, due_date);

-- ============================================
-- TABLE: email_templates
-- Templates voor emails
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,

    -- Template variables
    variables JSONB, -- Array van beschikbare variables: ["{{first_name}}", "{{cli_name}}"]

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers voor auto-update timestamps
DROP TRIGGER IF EXISTS update_nps_outreach_updated_at ON nps_outreach;
CREATE TRIGGER update_nps_outreach_updated_at
    BEFORE UPDATE ON nps_outreach
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_csm_tasks_updated_at ON csm_tasks;
CREATE TRIGGER update_csm_tasks_updated_at
    BEFORE UPDATE ON csm_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Voor nu simpel: alleen authenticated users
-- ============================================
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE csm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policies: Authenticated users hebben volledige toegang
CREATE POLICY "Authenticated users can access nps_responses"
    ON nps_responses FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can access nps_outreach"
    ON nps_outreach FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can access csm_tasks"
    ON csm_tasks FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can access email_templates"
    ON email_templates FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- SEED DATA: Default email template
-- ============================================
INSERT INTO email_templates (name, subject, body, variables)
VALUES (
    'Detractor Response',
    'Oeps... volgens ons verdienen jullie beter!',
    'Beste {{first_name}},

We zagen jouw tevredenheidsscore en moesten even slikken. Oeps… blijkbaar hebben we iets gemist.
En daar balen we van.

Kun je ons in 1 zin vertellen wat we écht beter moeten doen?
Geen lange vragenlijst, gewoon recht voor z''n raap.

Wij beloven: we doen er iets mee.

Met vriendelijke groet,

Luuk van Ravestein
Customer Success Manager
Timewax',
    '["{{first_name}}", "{{last_name}}", "{{cli_name}}", "{{score}}"]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- VIEWS: Handige views voor reporting
-- ============================================

-- View: Detractors met outreach status
CREATE OR REPLACE VIEW detractors_overview AS
SELECT
    nr.id,
    nr.cli_name,
    nr.user_email,
    nr.user_first_name,
    nr.user_last_name,
    nr.score,
    nr.feedback,
    nr.response_date,
    nr.imported_at,

    -- Outreach status
    COALESCE(no.status, 'not_sent') as outreach_status,
    no.sent_at,
    no.response_received_at,
    no.response_sentiment,
    no.response_urgency,
    no.response_summary,

    -- Task count
    (SELECT COUNT(*) FROM csm_tasks ct WHERE ct.nps_outreach_id = no.id AND ct.status != 'completed') as open_tasks

FROM nps_responses nr
LEFT JOIN nps_outreach no ON no.nps_response_id = nr.id
WHERE nr.is_detractor = true
ORDER BY nr.response_date DESC;

-- View: Dashboard statistics
CREATE OR REPLACE VIEW nps_dashboard_stats AS
SELECT
    COUNT(*) FILTER (WHERE is_detractor) as total_detractors,
    COUNT(*) FILTER (WHERE is_detractor AND EXISTS (
        SELECT 1 FROM nps_outreach WHERE nps_response_id = nps_responses.id AND status = 'sent'
    )) as detractors_emailed,
    COUNT(*) FILTER (WHERE is_detractor AND EXISTS (
        SELECT 1 FROM nps_outreach WHERE nps_response_id = nps_responses.id AND response_received_at IS NOT NULL
    )) as detractors_responded,
    COUNT(*) FILTER (WHERE is_detractor AND EXISTS (
        SELECT 1 FROM nps_outreach no
        JOIN csm_tasks ct ON ct.nps_outreach_id = no.id
        WHERE no.nps_response_id = nps_responses.id
        AND ct.status = 'completed'
    )) as detractors_resolved,

    -- Response rate
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE is_detractor AND EXISTS (
            SELECT 1 FROM nps_outreach WHERE nps_response_id = nps_responses.id AND response_received_at IS NOT NULL
        )) / NULLIF(COUNT(*) FILTER (WHERE is_detractor AND EXISTS (
            SELECT 1 FROM nps_outreach WHERE nps_response_id = nps_responses.id AND status = 'sent'
        )), 0),
        1
    ) as response_rate_percent,

    -- Average score
    ROUND(AVG(score) FILTER (WHERE is_detractor), 1) as avg_detractor_score

FROM nps_responses
WHERE response_date >= CURRENT_DATE - INTERVAL '90 days';

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE nps_responses IS 'NPS responses imported from Beamer CSV exports';
COMMENT ON TABLE nps_outreach IS 'Email outreach tracking for NPS detractors';
COMMENT ON TABLE csm_tasks IS 'CSM task management system';
COMMENT ON TABLE email_templates IS 'Email templates with variable support';
COMMENT ON VIEW detractors_overview IS 'Combined view of detractors with outreach status';
COMMENT ON VIEW nps_dashboard_stats IS 'Dashboard statistics for last 90 days';
