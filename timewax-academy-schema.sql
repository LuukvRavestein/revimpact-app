-- Timewax Academy Monitoring Schema
-- Run this script in your Supabase SQL editor

-- Academy data uploads table
CREATE TABLE IF NOT EXISTS academy_data_uploads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_type text NOT NULL DEFAULT 'xlsx',
  file_size integer NOT NULL,
  upload_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text DEFAULT 'uploaded' NOT NULL, -- 'uploaded', 'processed', 'error'
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Academy participant progress records
CREATE TABLE IF NOT EXISTS academy_participant_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  upload_id uuid REFERENCES academy_data_uploads(id) ON DELETE CASCADE,
  
  -- Participant information
  participant_name text NOT NULL,
  participant_email text NOT NULL,
  
  -- Derived customer name from email domain
  customer_name text,
  
  -- Module information
  lesson_module text NOT NULL,
  start_date date,
  completed_on date,
  
  -- Progress metrics
  score numeric,
  pass_threshold numeric,
  progress_percentage integer,
  duration_seconds integer, -- Duration in seconds (converted from H:MM:SS format)
  
  -- Additional information
  is_external_user boolean DEFAULT false,
  user_groups text[], -- Array of user groups
  
  -- Metadata
  raw_data jsonb, -- Store all original data as JSON
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on academy tables
ALTER TABLE academy_data_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_participant_progress ENABLE ROW LEVEL SECURITY;

-- Policies for academy_data_uploads
DROP POLICY IF EXISTS "Users can view uploads in their workspace" ON academy_data_uploads;
CREATE POLICY "Users can view uploads in their workspace" ON academy_data_uploads
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create uploads in their workspace" ON academy_data_uploads;
CREATE POLICY "Users can create uploads in their workspace" ON academy_data_uploads
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policies for academy_participant_progress
DROP POLICY IF EXISTS "Users can view progress in their workspace" ON academy_participant_progress;
CREATE POLICY "Users can view progress in their workspace" ON academy_participant_progress
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create progress records in their workspace" ON academy_participant_progress;
CREATE POLICY "Users can create progress records in their workspace" ON academy_participant_progress
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update progress in their workspace" ON academy_participant_progress;
CREATE POLICY "Users can update progress in their workspace" ON academy_participant_progress
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete progress in their workspace" ON academy_participant_progress;
CREATE POLICY "Users can delete progress in their workspace" ON academy_participant_progress
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_academy_uploads_workspace ON academy_data_uploads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_academy_uploads_created_by ON academy_data_uploads(created_by);
CREATE INDEX IF NOT EXISTS idx_academy_progress_workspace ON academy_participant_progress(workspace_id);
CREATE INDEX IF NOT EXISTS idx_academy_progress_upload ON academy_participant_progress(upload_id);
CREATE INDEX IF NOT EXISTS idx_academy_progress_customer ON academy_participant_progress(customer_name);
CREATE INDEX IF NOT EXISTS idx_academy_progress_participant ON academy_participant_progress(participant_email);
CREATE INDEX IF NOT EXISTS idx_academy_progress_participant_name ON academy_participant_progress(participant_name);

-- Success message
SELECT 'Timewax Academy schema setup completed successfully!' as status;

