-- Update disease_predictions table to store full analysis results
ALTER TABLE disease_predictions 
ADD COLUMN IF NOT EXISTS infection_level TEXT,
ADD COLUMN IF NOT EXISTS recommend_spray BOOLEAN,
ADD COLUMN IF NOT EXISTS analysis_results JSONB;

COMMENT ON COLUMN disease_predictions.infection_level IS 'The level of infection (LOW, MEDIUM, HIGH).';
COMMENT ON COLUMN disease_predictions.recommend_spray IS 'Whether the AI recommends spraying.';
COMMENT ON COLUMN disease_predictions.analysis_results IS 'Full JSON output of the top 3 AI results.';
