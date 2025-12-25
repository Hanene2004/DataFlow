-- CONSOLIDATED SETUP SCRIPT FOR SUPABASE
-- COPY AND PASTE THIS ENTIRE CONTENT INTO THE SQL EDITOR IN SUPABASE

-- 1. Create the datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  filename text NOT NULL,
  data jsonb NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  column_count integer NOT NULL DEFAULT 0,
  columns text[] NOT NULL DEFAULT '{}',
  stats jsonb DEFAULT '[]',
  kpis jsonb DEFAULT '[]',
  domain text,
  summary text,
  quality_score jsonb,
  recommendations jsonb DEFAULT '[]',
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON datasets;
DROP POLICY IF EXISTS "Allow public insert access" ON datasets;
DROP POLICY IF EXISTS "Users can view their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can insert their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can update their own datasets" ON datasets;
DROP POLICY IF EXISTS "Users can delete their own datasets" ON datasets;

-- 4. Create secure policies for authenticated users
CREATE POLICY "Users can view their own datasets"
  ON datasets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own datasets"
  ON datasets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets"
  ON datasets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets"
  ON datasets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Success message
-- The database is now ready for use.
