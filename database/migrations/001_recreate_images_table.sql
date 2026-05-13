CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE IF EXISTS disease_predictions
DROP CONSTRAINT IF EXISTS disease_predictions_image_id_fkey;

TRUNCATE TABLE disease_predictions;

DROP TABLE IF EXISTS images;

CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  crop_name TEXT NOT NULL,
  crop_variety TEXT,
  original_file_name TEXT NOT NULL,
  stored_file_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  image_size_bytes INTEGER NOT NULL CHECK (image_size_bytes > 0),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_images_uploaded_at ON images (uploaded_at DESC);
CREATE INDEX idx_images_crop_name ON images (crop_name);

ALTER TABLE disease_predictions
ADD CONSTRAINT disease_predictions_image_id_fkey
FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL;

COMMENT ON TABLE images IS 'Uploaded crop images used for disease analysis.';
COMMENT ON COLUMN images.crop_id IS 'Optional reference to the crops table.';
COMMENT ON COLUMN images.crop_name IS 'Crop type selected during upload.';
COMMENT ON COLUMN images.crop_variety IS 'Optional crop variety selected during upload.';
COMMENT ON COLUMN images.original_file_name IS 'Original uploaded file name from the client.';
COMMENT ON COLUMN images.stored_file_name IS 'Generated file name stored under backend/uploads.';
COMMENT ON COLUMN images.image_url IS 'Public relative URL for the stored upload.';
COMMENT ON COLUMN images.mime_type IS 'Uploaded image MIME type.';
COMMENT ON COLUMN images.image_size_bytes IS 'Uploaded image size in bytes.';
