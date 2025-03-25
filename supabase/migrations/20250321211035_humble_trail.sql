/*
  # Fix slider content table and policies
  
  1. Changes
    - Add IF NOT EXISTS checks for constraints
    - Drop existing policies before recreating
    - Add unique constraint for order if not exists
    - Upsert initial content
    
  2. Security
    - Maintain RLS policies
    - Keep admin-only modifications
*/

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

-- Add unique constraint on order if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'slider_content_order_unique'
  ) THEN
    ALTER TABLE slider_content
    ADD CONSTRAINT slider_content_order_unique UNIQUE ("order");
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read slider content" ON slider_content;
DROP POLICY IF EXISTS "Only admins can modify slider content" ON slider_content;

-- Create policies
CREATE POLICY "Anyone can read slider content"
  ON slider_content
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify slider content"
  ON slider_content
  FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- Insert or update initial slider content
INSERT INTO slider_content (image_url, title, subtitle, "order")
VALUES
  ('https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2000&auto=format&fit=crop',
   'Location de voitures premium',
   'Des véhicules haut de gamme pour tous vos besoins',
   1),
  ('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2000&auto=format&fit=crop',
   'Service de qualité',
   'Une équipe professionnelle à votre service',
   2),
  ('https://images.unsplash.com/photo-1619767886558-efdc259b6e09?q=80&w=2000&auto=format&fit=crop',
   'Livraison à domicile',
   'Partout en Côte d''Ivoire',
   3)
ON CONFLICT ("order") 
DO UPDATE SET
  image_url = EXCLUDED.image_url,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle;