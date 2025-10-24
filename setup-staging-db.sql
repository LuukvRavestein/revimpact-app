-- Staging Database Setup Script
-- Run this on your staging Supabase project

-- 1. Create basic tables
\i database-schema.sql

-- 2. Create workspace invitations
\i workspace-invitations-schema.sql

-- 3. Complete setup with policies
\i complete-database-setup.sql

-- 4. Add some test data for staging
INSERT INTO workspaces (id, name, created_at) VALUES 
('staging-workspace-1', 'Staging Test Workspace', NOW())
ON CONFLICT (id) DO NOTHING;

-- Note: You'll need to manually add users and workspace members
-- through the application interface
