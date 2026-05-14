-- Migration to fix timezone issues by converting timestamp columns to TIMESTAMPTZ

-- Fix disease_predictions table
ALTER TABLE disease_predictions 
ALTER COLUMN detected_at TYPE TIMESTAMPTZ USING detected_at AT TIME ZONE 'UTC';

-- Fix farms table
ALTER TABLE farms 
ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- Fix crops table
ALTER TABLE crops 
ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- Fix spray_logs table
-- First check if created_at exists, if not add it correctly
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='spray_logs' AND column_name='created_at') THEN
        ALTER TABLE spray_logs ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    ELSE
        ALTER TABLE spray_logs ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
    END IF;
END $$;

-- Ensure images table is also correct (it should be already, but just in case)
ALTER TABLE images 
ALTER COLUMN uploaded_at TYPE TIMESTAMPTZ USING uploaded_at AT TIME ZONE 'UTC';
