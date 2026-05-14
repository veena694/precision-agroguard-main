-- Drop unused tables
DROP TABLE IF EXISTS crops CASCADE;
DROP TABLE IF EXISTS farms CASCADE;

-- Remove crop_id from images if it exists
ALTER TABLE images DROP COLUMN IF EXISTS crop_id;

-- Ensure spray_logs has the correct columns (in case migration 005 failed)
ALTER TABLE spray_logs 
ADD COLUMN IF NOT EXISTS crop_name TEXT,
ADD COLUMN IF NOT EXISTS disease_name TEXT,
ADD COLUMN IF NOT EXISTS infection_level TEXT,
ADD COLUMN IF NOT EXISTS spray_type TEXT;
