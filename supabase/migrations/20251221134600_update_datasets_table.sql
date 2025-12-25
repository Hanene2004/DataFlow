-- Add missing columns to datasets table for advanced analysis
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS kpis jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS domain text,
ADD COLUMN IF NOT EXISTS summary text,
ADD COLUMN IF NOT EXISTS quality_score jsonb,
ADD COLUMN IF NOT EXISTS recommendations jsonb DEFAULT '[]';

-- Update the insert policy if needed (already Allow public insert access in previous migration)
