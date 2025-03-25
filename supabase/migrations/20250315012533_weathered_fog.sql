/*
  # Système de réservation

  1. Nouvelles Tables
    - `promotions`
      - `id` (uuid, primary key)
      - `duration_weeks` (integer) - Durée en semaines
      - `discount` (integer) - Montant de la réduction en FCFA
      - `created_at` (timestamp)

    - `payments`
      - `id` (uuid, primary key)
      - `reservation_id` (uuid, foreign key)
      - `amount` (integer) - Montant du paiement
      - `receipt_url` (text) - URL du reçu
      - `created_at` (timestamp)

  2. Modifications
    - Ajout de colonnes à la table `reservations`
      - `deposit_amount` (integer) - Montant de l'avance (50% du total)
      - `deposit_status` (text) - Statut du paiement de l'avance
      - `receipt_url` (text) - URL du reçu de paiement

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create promotions table
CREATE TABLE promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_weeks integer NOT NULL,
  discount integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert default promotions
INSERT INTO promotions (duration_weeks, discount) VALUES
  (1, 5000),  -- 5000 FCFA pour 1 semaine
  (3, 10000); -- 10000 FCFA pour 3 semaines ou plus

-- Enable RLS on promotions
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Create policies for promotions
CREATE POLICY "Anyone can read promotions"
  ON promotions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify promotions"
  ON promotions
  FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- Create payments table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  receipt_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Users can read their own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.id = payments.reservation_id
      AND reservations.user_id = auth.uid()
    ) OR
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Only admins can create payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' = 'admin');

-- Add new columns to reservations table
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS deposit_amount integer NOT NULL,
ADD COLUMN IF NOT EXISTS deposit_status text NOT NULL DEFAULT 'pending'
  CHECK (deposit_status IN ('pending', 'received')),
ADD COLUMN IF NOT EXISTS receipt_url text;

-- Create function to check user status before reservation
CREATE OR REPLACE FUNCTION check_user_status()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = NEW.user_id
    AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'User must be approved to make a reservation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check user status before reservation
DROP TRIGGER IF EXISTS check_user_status_before_reservation ON reservations;
CREATE TRIGGER check_user_status_before_reservation
  BEFORE INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION check_user_status();

-- Update reservation policies
DROP POLICY IF EXISTS "Users can create their own reservations" ON reservations;
CREATE POLICY "Users can create their own reservations"
  ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND status = 'approved'
    )
  );

DROP POLICY IF EXISTS "Users can read their own reservations" ON reservations;
CREATE POLICY "Users can read their own reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    auth.jwt()->>'role' = 'admin'
  );

-- Create notification type for payments
DO $$
BEGIN
  ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS valid_type;
  
  ALTER TABLE notifications
    ADD CONSTRAINT valid_type
    CHECK (type = ANY (ARRAY[
      'welcome'::text,
      'document_status'::text,
      'reservation'::text,
      'receipt'::text,
      'payment'::text
    ]));
END $$;