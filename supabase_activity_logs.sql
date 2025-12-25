-- Activity Logging System for MultiHub
-- Run this script in your Supabase SQL Editor

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('upload', 'clean', 'analysis', 'comparison', 'export_pdf', 'share_email', 'login', 'logout')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  dataset_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_dataset_id ON activity_logs(dataset_id);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own activities" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert their own activities" ON activity_logs;

-- RLS Policy: Users can only view their own activities
CREATE POLICY "Users can view their own activities"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own activities
CREATE POLICY "Users can insert their own activities"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON activity_logs TO authenticated;

-- Create a function to clean old activities (optional, for maintenance)
CREATE OR REPLACE FUNCTION clean_old_activities(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM activity_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on table and columns
COMMENT ON TABLE activity_logs IS 'Stores all user activities for audit and history tracking';
COMMENT ON COLUMN activity_logs.activity_type IS 'Type of activity: upload, clean, analysis, comparison, export_pdf, share_email, login, logout';
COMMENT ON COLUMN activity_logs.metadata IS 'Additional JSON data about the activity';
COMMENT ON COLUMN activity_logs.dataset_id IS 'Reference to the dataset if applicable';
