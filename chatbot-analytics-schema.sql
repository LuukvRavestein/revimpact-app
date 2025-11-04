-- Chatbot Analytics Schema
-- Run this script in your Supabase SQL editor

-- Chatbot data uploads table
CREATE TABLE IF NOT EXISTS chatbot_data_uploads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_type text NOT NULL DEFAULT 'xlsx',
  file_size integer NOT NULL,
  upload_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text DEFAULT 'uploaded' NOT NULL, -- 'uploaded', 'processed', 'error'
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Chatbot conversation records
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  upload_id uuid REFERENCES chatbot_data_uploads(id) ON DELETE CASCADE,
  
  -- Conversation information
  conversation_id text NOT NULL,
  usr_id text,
  cli_id text,
  customer_name text,
  
  -- Message information
  content text NOT NULL,
  message_type text NOT NULL, -- 'USER' or 'ASSISTANT'
  username text,
  timestamp timestamp with time zone,
  
  -- Analysis results
  is_forwarded boolean DEFAULT false,
  is_self_resolved boolean DEFAULT false,
  topic text,
  
  -- Metadata
  raw_data jsonb, -- Store all original data as JSON
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_workspace ON chatbot_conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_upload ON chatbot_conversations(upload_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_conversation ON chatbot_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_customer ON chatbot_conversations(customer_name);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_timestamp ON chatbot_conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_chatbot_uploads_workspace ON chatbot_data_uploads(workspace_id);

-- Enable RLS on chatbot tables
ALTER TABLE chatbot_data_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Policies for chatbot_data_uploads
DROP POLICY IF EXISTS "Users can view uploads in their workspace" ON chatbot_data_uploads;
CREATE POLICY "Users can view uploads in their workspace" ON chatbot_data_uploads
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert uploads in their workspace" ON chatbot_data_uploads;
CREATE POLICY "Users can insert uploads in their workspace" ON chatbot_data_uploads
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update uploads in their workspace" ON chatbot_data_uploads;
CREATE POLICY "Users can update uploads in their workspace" ON chatbot_data_uploads
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Policies for chatbot_conversations
DROP POLICY IF EXISTS "Users can view conversations in their workspace" ON chatbot_conversations;
CREATE POLICY "Users can view conversations in their workspace" ON chatbot_conversations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert conversations in their workspace" ON chatbot_conversations;
CREATE POLICY "Users can insert conversations in their workspace" ON chatbot_conversations
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete conversations in their workspace" ON chatbot_conversations;
CREATE POLICY "Users can delete conversations in their workspace" ON chatbot_conversations
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

SELECT 'Chatbot Analytics schema setup completed successfully!' as status;

