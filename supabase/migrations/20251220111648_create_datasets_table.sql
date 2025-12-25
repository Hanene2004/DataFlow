/*
  # Create Datasets Table

  1. New Tables
    - `datasets`
      - `id` (uuid, primary key)
      - `filename` (text) - Original filename of uploaded Excel file
      - `data` (jsonb) - Parsed Excel data stored as JSON
      - `row_count` (integer) - Number of rows in the dataset
      - `column_count` (integer) - Number of columns in the dataset
      - `columns` (text array) - Array of column names
      - `uploaded_at` (timestamptz) - Timestamp of upload
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `datasets` table
    - Add policy for public access (allowing anyone to upload and view datasets for demo purposes)
    
  3. Notes
    - This is a demo application allowing public access
    - In production, you would restrict access to authenticated users
*/

CREATE TABLE IF NOT EXISTS datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  data jsonb NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  column_count integer NOT NULL DEFAULT 0,
  columns text[] NOT NULL DEFAULT '{}',
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON datasets
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON datasets
  FOR INSERT
  WITH CHECK (true);