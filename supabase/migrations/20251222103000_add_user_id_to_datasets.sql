-- Add user_id column to datasets table
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- Backfill user_id for existing rows if they exist (setting them to the current user if possible, but since it's a demo, might be null)
-- UPDATE datasets SET user_id = auth.uid() WHERE user_id IS NULL;

-- Drop existing public policies
DROP POLICY IF EXISTS "Allow public read access" ON datasets;
DROP POLICY IF EXISTS "Allow public insert access" ON datasets;

-- Create new RLS policies for authenticated users
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
