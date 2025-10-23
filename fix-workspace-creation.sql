-- Fix for workspace creation issues
-- Run this in Supabase SQL editor

-- Create a function to handle workspace creation with proper permissions
CREATE OR REPLACE FUNCTION create_user_workspace(workspace_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workspace_id uuid;
  result json;
BEGIN
  -- Create workspace
  INSERT INTO workspaces (name, created_by)
  VALUES (workspace_name, auth.uid())
  RETURNING id INTO workspace_id;
  
  -- Create membership
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (workspace_id, auth.uid(), 'owner');
  
  -- Return result
  SELECT json_build_object(
    'id', workspace_id,
    'name', workspace_name,
    'success', true
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_workspace(text) TO authenticated;

-- Alternative: Temporarily disable RLS for workspace creation (if needed)
-- ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS after testing (uncomment when ready)
-- ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
