-- Add order column to slider_content table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'slider_content' AND column_name = 'order'
  ) THEN
    ALTER TABLE slider_content ADD COLUMN "order" integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Update existing slider content with proper order
UPDATE slider_content
SET "order" = CASE
  WHEN title LIKE '%premium%' THEN 1
  WHEN title LIKE '%qualité%' THEN 2
  WHEN title LIKE '%livraison%' THEN 3
  ELSE "order"
END
WHERE "order" = 0;

-- Add unique constraint on order
ALTER TABLE slider_content
ADD CONSTRAINT slider_content_order_unique UNIQUE ("order");