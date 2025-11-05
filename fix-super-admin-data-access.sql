-- Fix RLS policies to allow super admins to access workspace data
-- Run this in your Supabase SQL editor
-- This ensures super admins can view all workspace data even without membership

-- Ensure the is_admin_user() function exists
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user email contains 'admin' or is specific admin emails
  RETURN (
    auth.jwt() ->> 'email' ILIKE '%admin%' OR
    auth.jwt() ->> 'email' = 'luuk@revimpact.nl' OR
    auth.jwt() ->> 'email' = 'admin@revimpact.nl'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AI AGENT TABLES
-- ============================================

-- Check if AI tables exist and update policies
DO $$
BEGIN
  -- Workspace AI Agents
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workspace_ai_agents') THEN
    DROP POLICY IF EXISTS "Users can view AI agents in their workspace" ON workspace_ai_agents;
    CREATE POLICY "Users can view AI agents in their workspace" ON workspace_ai_agents
      FOR SELECT USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can manage AI agents in their workspace" ON workspace_ai_agents;
    CREATE POLICY "Users can manage AI agents in their workspace" ON workspace_ai_agents
      FOR ALL USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- AI Analysis Results
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_analysis_results') THEN
    DROP POLICY IF EXISTS "Users can view analysis results in their workspace" ON ai_analysis_results;
    CREATE POLICY "Users can view analysis results in their workspace" ON ai_analysis_results
      FOR SELECT USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can create analysis results in their workspace" ON ai_analysis_results;
    CREATE POLICY "Users can create analysis results in their workspace" ON ai_analysis_results
      FOR INSERT WITH CHECK (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- AI Generated Dashboards
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_generated_dashboards') THEN
    DROP POLICY IF EXISTS "Users can view dashboards in their workspace" ON ai_generated_dashboards;
    CREATE POLICY "Users can view dashboards in their workspace" ON ai_generated_dashboards
      FOR SELECT USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can manage dashboards in their workspace" ON ai_generated_dashboards;
    CREATE POLICY "Users can manage dashboards in their workspace" ON ai_generated_dashboards
      FOR ALL USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- Dashboard Widgets
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dashboard_widgets') THEN
    DROP POLICY IF EXISTS "Users can view widgets in their workspace" ON dashboard_widgets;
    CREATE POLICY "Users can view widgets in their workspace" ON dashboard_widgets
      FOR SELECT USING (
        is_admin_user() OR
        dashboard_id IN (
          SELECT id FROM ai_generated_dashboards 
          WHERE workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
          )
        )
      );

    DROP POLICY IF EXISTS "Users can manage widgets in their workspace" ON dashboard_widgets;
    CREATE POLICY "Users can manage widgets in their workspace" ON dashboard_widgets
      FOR ALL USING (
        is_admin_user() OR
        dashboard_id IN (
          SELECT id FROM ai_generated_dashboards 
          WHERE workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid()
          )
        )
      );
  END IF;

  -- AI Training Metadata
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_training_metadata') THEN
    DROP POLICY IF EXISTS "Users can view training metadata in their workspace" ON ai_training_metadata;
    CREATE POLICY "Users can view training metadata in their workspace" ON ai_training_metadata
      FOR SELECT USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can manage training metadata in their workspace" ON ai_training_metadata;
    CREATE POLICY "Users can manage training metadata in their workspace" ON ai_training_metadata
      FOR ALL USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================
-- ACADEMY TABLES
-- ============================================

-- Academy Data Uploads - Update existing policies to include admin access
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'academy_data_uploads') THEN
    DROP POLICY IF EXISTS "Users can view uploads in their workspace" ON academy_data_uploads;
    CREATE POLICY "Users can view uploads in their workspace" ON academy_data_uploads
      FOR SELECT USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can create uploads in their workspace" ON academy_data_uploads;
    CREATE POLICY "Users can create uploads in their workspace" ON academy_data_uploads
      FOR INSERT WITH CHECK (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'academy_participant_progress') THEN
    DROP POLICY IF EXISTS "Users can view progress in their workspace" ON academy_participant_progress;
    CREATE POLICY "Users can view progress in their workspace" ON academy_participant_progress
      FOR SELECT USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can create progress records in their workspace" ON academy_participant_progress;
    CREATE POLICY "Users can create progress records in their workspace" ON academy_participant_progress
      FOR INSERT WITH CHECK (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can update progress in their workspace" ON academy_participant_progress;
    CREATE POLICY "Users can update progress in their workspace" ON academy_participant_progress
      FOR UPDATE USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can delete progress in their workspace" ON academy_participant_progress;
    CREATE POLICY "Users can delete progress in their workspace" ON academy_participant_progress
      FOR DELETE USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================
-- CHATBOT TABLES
-- ============================================

-- Check if chatbot tables exist and update policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chatbot_data_uploads') THEN
    DROP POLICY IF EXISTS "Users can view uploads in their workspace" ON chatbot_data_uploads;
    CREATE POLICY "Users can view uploads in their workspace" ON chatbot_data_uploads
      FOR SELECT USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can insert uploads in their workspace" ON chatbot_data_uploads;
    CREATE POLICY "Users can insert uploads in their workspace" ON chatbot_data_uploads
      FOR INSERT WITH CHECK (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can update uploads in their workspace" ON chatbot_data_uploads;
    CREATE POLICY "Users can update uploads in their workspace" ON chatbot_data_uploads
      FOR UPDATE USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chatbot_conversations') THEN
    DROP POLICY IF EXISTS "Users can view conversations in their workspace" ON chatbot_conversations;
    CREATE POLICY "Users can view conversations in their workspace" ON chatbot_conversations
      FOR SELECT USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can insert conversations in their workspace" ON chatbot_conversations;
    CREATE POLICY "Users can insert conversations in their workspace" ON chatbot_conversations
      FOR INSERT WITH CHECK (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Users can delete conversations in their workspace" ON chatbot_conversations;
    CREATE POLICY "Users can delete conversations in their workspace" ON chatbot_conversations
      FOR DELETE USING (
        is_admin_user() OR
        workspace_id IN (
          SELECT workspace_id FROM workspace_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Success message
SELECT 'Super admin data access policies updated successfully!' as status;

