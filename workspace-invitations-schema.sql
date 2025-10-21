-- Workspace Invitations and Enhanced Multi-tenant Setup
-- Run this in your Supabase SQL editor after the main database setup

-- Workspace invitations table
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member', -- 'member', 'admin'
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' NOT NULL, -- 'pending', 'accepted', 'declined', 'expired'
  token text UNIQUE NOT NULL, -- Unique token for invitation link
  expires_at timestamp with time zone DEFAULT (timezone('utc'::text, now()) + interval '7 days') NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at timestamp with time zone,
  UNIQUE(workspace_id, email) -- Prevent duplicate invitations
);

-- Enhanced workspace members with additional fields
ALTER TABLE workspace_members 
ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS joined_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Workspace settings table
CREATE TABLE IF NOT EXISTS workspace_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  company_name text,
  company_domain text,
  timezone text DEFAULT 'UTC',
  date_format text DEFAULT 'YYYY-MM-DD',
  currency text DEFAULT 'USD',
  logo_url text,
  custom_branding jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User activity logs for workspace
CREATE TABLE IF NOT EXISTS workspace_activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'login', 'upload_data', 'generate_qbr', 'invite_user', etc.
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for workspace_invitations
DROP POLICY IF EXISTS "Users can view invitations for their workspace" ON workspace_invitations;
CREATE POLICY "Users can view invitations for their workspace" ON workspace_invitations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can create invitations" ON workspace_invitations;
CREATE POLICY "Admins can create invitations" ON workspace_invitations
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update invitations" ON workspace_invitations;
CREATE POLICY "Admins can update invitations" ON workspace_invitations
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policies for workspace_settings
DROP POLICY IF EXISTS "Users can view settings for their workspace" ON workspace_settings;
CREATE POLICY "Users can view settings for their workspace" ON workspace_settings
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can update workspace settings" ON workspace_settings;
CREATE POLICY "Admins can update workspace settings" ON workspace_settings
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policies for workspace_activity_logs
DROP POLICY IF EXISTS "Users can view activity logs for their workspace" ON workspace_activity_logs;
CREATE POLICY "Users can view activity logs for their workspace" ON workspace_activity_logs
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create activity logs" ON workspace_activity_logs;
CREATE POLICY "Users can create activity logs" ON workspace_activity_logs
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace ON workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_status ON workspace_invitations(status);
CREATE INDEX IF NOT EXISTS idx_workspace_settings_workspace ON workspace_settings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_logs_workspace ON workspace_activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_logs_user ON workspace_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_logs_created ON workspace_activity_logs(created_at);

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE workspace_invitations 
  SET status = 'expired' 
  WHERE status = 'pending' 
  AND expires_at < timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate token for new invitations
CREATE OR REPLACE FUNCTION set_invitation_token()
RETURNS trigger AS $$
BEGIN
  IF NEW.token IS NULL OR NEW.token = '' THEN
    NEW.token := generate_invitation_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_invitation_token ON workspace_invitations;
CREATE TRIGGER trigger_set_invitation_token
  BEFORE INSERT ON workspace_invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_invitation_token();

-- Success message
SELECT 'Workspace invitations and multi-tenant enhancements completed successfully!' as status;
