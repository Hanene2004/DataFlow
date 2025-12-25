-- RUN THIS IN THE SUPABASE SQL EDITOR

-- 1. Add missing analytics columns to datasets
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS anomalies text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS correlations jsonb DEFAULT '[]';

-- 2. Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  dataset_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS and setup policies for activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Users can insert their own activities') THEN
        CREATE POLICY "Users can insert their own activities" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Users can view their own activities') THEN
        CREATE POLICY "Users can view their own activities" ON activity_logs FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;
