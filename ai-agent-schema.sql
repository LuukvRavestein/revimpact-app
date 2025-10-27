-- AI Agent System Database Schema
-- Add to your existing Supabase database

-- AI Agents per workspace
CREATE TABLE IF NOT EXISTS workspace_ai_agents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name text NOT NULL DEFAULT 'AI Assistant',
  agent_personality text, -- Custom personality for this workspace
  training_data_summary jsonb, -- Summary of training data (not actual data)
  custom_prompts text[], -- Workspace-specific prompts
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workspace_id)
);

-- AI Analysis Results
CREATE TABLE IF NOT EXISTS ai_analysis_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  upload_id uuid REFERENCES customer_data_uploads(id) ON DELETE CASCADE,
  analysis_type text NOT NULL, -- 'customer_behavior', 'revenue_trends', 'churn_prediction', 'custom'
  analysis_prompt text, -- The prompt used for analysis
  insights jsonb NOT NULL, -- Structured insights
  recommendations jsonb NOT NULL, -- AI recommendations
  confidence_score numeric DEFAULT 0.0, -- AI confidence in analysis
  processing_time_ms integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI Generated Dashboards
CREATE TABLE IF NOT EXISTS ai_generated_dashboards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  analysis_id uuid REFERENCES ai_analysis_results(id) ON DELETE CASCADE,
  dashboard_name text NOT NULL,
  dashboard_description text,
  dashboard_config jsonb NOT NULL, -- Dashboard layout and widgets
  generation_prompt text, -- Prompt used to generate dashboard
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Dashboard Widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id uuid REFERENCES ai_generated_dashboards(id) ON DELETE CASCADE,
  widget_type text NOT NULL, -- 'chart', 'metric', 'table', 'text'
  widget_title text NOT NULL,
  widget_config jsonb NOT NULL, -- Widget-specific configuration
  data_query jsonb, -- Query to get data for widget
  position_x integer DEFAULT 0,
  position_y integer DEFAULT 0,
  width integer DEFAULT 4,
  height integer DEFAULT 3,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI Training Data (metadata only, not actual customer data)
CREATE TABLE IF NOT EXISTS ai_training_metadata (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  data_type text NOT NULL, -- 'customer_data', 'dashboard_preferences', 'business_context'
  data_summary jsonb NOT NULL, -- Summary statistics, not actual data
  training_purpose text, -- What this data is used for
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE workspace_ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI tables
-- Workspace AI Agents
CREATE POLICY "Users can view AI agents in their workspace" ON workspace_ai_agents
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage AI agents in their workspace" ON workspace_ai_agents
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- AI Analysis Results
CREATE POLICY "Users can view analysis results in their workspace" ON ai_analysis_results
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create analysis results in their workspace" ON ai_analysis_results
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- AI Generated Dashboards
CREATE POLICY "Users can view dashboards in their workspace" ON ai_generated_dashboards
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage dashboards in their workspace" ON ai_generated_dashboards
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Dashboard Widgets
CREATE POLICY "Users can view widgets in their workspace" ON dashboard_widgets
  FOR SELECT USING (
    dashboard_id IN (
      SELECT id FROM ai_generated_dashboards 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage widgets in their workspace" ON dashboard_widgets
  FOR ALL USING (
    dashboard_id IN (
      SELECT id FROM ai_generated_dashboards 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- AI Training Metadata
CREATE POLICY "Users can view training metadata in their workspace" ON ai_training_metadata
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage training metadata in their workspace" ON ai_training_metadata
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_ai_agents_workspace ON workspace_ai_agents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_workspace ON ai_analysis_results(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_upload ON ai_analysis_results(upload_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_dashboards_workspace ON ai_generated_dashboards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_metadata_workspace ON ai_training_metadata(workspace_id);

-- Success message
SELECT 'AI Agent system database schema created successfully!' as status;
