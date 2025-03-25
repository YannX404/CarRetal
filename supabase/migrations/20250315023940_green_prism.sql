/*
  # Add popular vehicles support

  1. Changes
    - Add is_popular column to vehicles table
    - Add initial popular vehicles

  2. Security
    - No changes to RLS policies needed
*/

-- Add is_popular column to vehicles table
ALTER TABLE vehicles
ADD COLUMN is_popular boolean DEFAULT false;

-- Update some vehicles to be popular
UPDATE vehicles
SET is_popular = true
WHERE name IN (
  'Mercedes-Benz Classe C',
  'Toyota Land Cruiser',
  'Hyundai Santa Fe'
);