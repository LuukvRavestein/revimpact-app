-- Workspace Features and User Management Setup (FIXED VERSION)
-- Run this in your Supabase SQL editor

-- First, drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS workspace_invitations CASCADE;
DROP TABLE IF EXISTS workspace_settings CASCADE;
DROP TABLE IF EXISTS workspace_features CASCADE;

-- Add workspace features table
CREATE TABLE workspace_features (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workspace_id, feature_name)
);

-- Add workspace settings table
CREATE TABLE workspace_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workspace_id, setting_key)
);

-- Add workspace invitations table
CREATE TABLE workspace_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  invited_by uuid REFERENCES auth.users(id),
  token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, expired
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at timestamp with time zone
);

-- Enable RLS on new tables
ALTER TABLE workspace_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for workspace_features
CREATE POLICY "Users can view workspace features they belong to" ON workspace_features
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    ) OR is_admin_user()
  );

CREATE POLICY "Admins can manage workspace features" ON workspace_features
  FOR ALL USING (is_admin_user());

CREATE POLICY "Workspace owners can manage features" ON workspace_features
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS policies for workspace_settings
CREATE POLICY "Users can view workspace settings they belong to" ON workspace_settings
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    ) OR is_admin_user()
  );

CREATE POLICY "Admins can manage workspace settings" ON workspace_settings
  FOR ALL USING (is_admin_user());

CREATE POLICY "Workspace owners can manage settings" ON workspace_settings
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS policies for workspace_invitations
CREATE POLICY "Users can view workspace invitations they belong to" ON workspace_invitations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    ) OR is_admin_user()
  );

CREATE POLICY "Admins can manage workspace invitations" ON workspace_invitations
  FOR ALL USING (is_admin_user());

CREATE POLICY "Workspace owners can manage invitations" ON workspace_invitations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Insert default features for existing workspaces
INSERT INTO workspace_features (workspace_id, feature_name, enabled)
SELECT 
  w.id,
  feature_name,
  CASE 
    WHEN feature_name = 'data_upload' THEN true
    WHEN feature_name = 'qbr_generator' THEN true
    WHEN feature_name = 'workspace_settings' THEN true
    WHEN feature_name = 'chatbot_analytics' AND w.name ILIKE '%timewax%' THEN true
    ELSE false
  END
FROM workspaces w
CROSS JOIN (
  VALUES 
    ('data_upload'),
    ('qbr_generator'),
    ('workspace_settings'),
    ('chatbot_analytics'),
    ('admin_panel')
) AS features(feature_name);

-- Insert default settings for existing workspaces
INSERT INTO workspace_settings (workspace_id, setting_key, setting_value)
SELECT 
  w.id,
  setting_key,
  setting_value
FROM workspaces w
CROSS JOIN (
  VALUES 
    ('client_type', 'generic'),
    ('timezone', 'Europe/Amsterdam'),
    ('language', 'nl'),
    ('notifications_enabled', 'true')
) AS settings(setting_key, setting_value);
