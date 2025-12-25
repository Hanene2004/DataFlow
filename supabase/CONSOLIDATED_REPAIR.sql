-- ==========================================
-- MULTIHUB ANALYTICS: CONSOLIDATED SCHEMA FIX
-- ==========================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Ensure 'datasets' table has all required analytics columns
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS kpis jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS domain text DEFAULT 'General',
ADD COLUMN IF NOT EXISTS summary text DEFAULT '',
ADD COLUMN IF NOT EXISTS quality_score jsonb DEFAULT '{"score": 0, "penalties": [], "grade": "N/A"}'::jsonb,
ADD COLUMN IF NOT EXISTS recommendations jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS anomalies text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS correlations jsonb DEFAULT '[]'::jsonb;

-- 2. Create 'activity_logs' table for audit tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  dataset_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Setup Row Level Security (RLS) for activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (ignore error if they already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Users can insert their own activities') THEN
        CREATE POLICY "Users can insert their own activities" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Users can view their own activities') THEN
        CREATE POLICY "Users can view their own activities" ON activity_logs FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Grant permissions to authenticated users
GRANT ALL ON activity_logs TO authenticated;
GRANT ALL ON datasets TO authenticated;
