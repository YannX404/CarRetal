/*
  # Add slider content management

  1. New Tables
    - `slider_content` : Home page slider content management
      - `id` (uuid, primary key)
      - `image_url` (text)
      - `title` (text)
      - `subtitle` (text)
      - `order` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for admin access
*/

-- Create slider content table
CREATE TABLE slider_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE slider_content ENABLE ROW LEVEL SECURITY;

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

-- Insert initial slider content
INSERT INTO slider_content (image_url, title, subtitle, "order") VALUES
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
   3);