-- Add new columns to spray_logs table
ALTER TABLE spray_logs 
ADD COLUMN IF NOT EXISTS crop_name TEXT,
ADD COLUMN IF NOT EXISTS disease_name TEXT,
ADD COLUMN IF NOT EXISTS infection_level TEXT,
ADD COLUMN IF NOT EXISTS spray_type TEXT;

-- Update existing records if any (optional)
UPDATE spray_logs SET spray_type = 'Manual' WHERE spray_type IS NULL;
