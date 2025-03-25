/*
  # Fix admin issues and add driver option
  
  1. Changes
    - Fix vehicle policies to allow public access
    - Add driver option to reservations
    - Fix user status triggers
    
  2. Security
    - Maintain RLS policies
    - Keep security checks in place
*/

-- Update vehicle policies to allow public access
DROP POLICY IF EXISTS "Anyone can read vehicles" ON vehicles;
CREATE POLICY "Anyone can read vehicles"
  ON vehicles
  FOR SELECT
  TO public
  USING (true);

-- Add driver option to reservations
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS with_driver boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS driver_fee integer DEFAULT 10000;

-- Fix user status triggers
CREATE OR REPLACE FUNCTION handle_document_status_update()
RETURNS trigger AS $$
DECLARE
  v_cni_status text;
  v_permis_status text;
  v_facture_status text;
  v_new_user_status text;
BEGIN
  -- Get latest status of each required document
  SELECT status INTO v_cni_status
  FROM documents
  WHERE user_id = NEW.user_id AND type = 'cni'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT status INTO v_permis_status
  FROM documents
  WHERE user_id = NEW.user_id AND type = 'permis'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT status INTO v_facture_status
  FROM documents
  WHERE user_id = NEW.user_id AND type = 'facture'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Determine new user status
  IF COALESCE(v_cni_status, 'pending') = 'approved' 
    AND COALESCE(v_permis_status, 'pending') = 'approved' 
    AND COALESCE(v_facture_status, 'pending') = 'approved' THEN
    v_new_user_status := 'approved';
  ELSIF v_cni_status = 'rejected' 
    OR v_permis_status = 'rejected' 
    OR v_facture_status = 'rejected' THEN
    v_new_user_status := 'rejected';
  ELSIF v_cni_status IS NOT NULL 
    OR v_permis_status IS NOT NULL 
    OR v_facture_status IS NOT NULL THEN
    v_new_user_status := 'submitted';
  ELSE
    v_new_user_status := 'pending';
  END IF;

  -- Update user status
  UPDATE users
  SET status = v_new_user_status
  WHERE id = NEW.user_id;

  -- Create notification for document status change
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type
  ) VALUES (
    NEW.user_id,
    CASE 
      WHEN NEW.status = 'approved' THEN 'Document approuvé'
      ELSE 'Document rejeté'
    END,
    CASE 
      WHEN NEW.status = 'approved' THEN 
        CASE 
          WHEN v_new_user_status = 'approved' THEN 'Tous vos documents ont été approuvés. Vous pouvez maintenant effectuer des réservations.'
          ELSE 'Votre document a été approuvé.'
        END
      ELSE 'Votre document a été rejeté. Veuillez soumettre un nouveau document.'
    END,
    'document_status'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle user status updates
CREATE OR REPLACE FUNCTION handle_user_status_update()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if status has changed
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Create notification for status change
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type
  ) VALUES (
    NEW.id,
    CASE 
      WHEN NEW.status = 'approved' THEN 'Compte approuvé'
      WHEN NEW.status = 'rejected' THEN 'Compte rejeté'
      ELSE 'Statut mis à jour'
    END,
    CASE 
      WHEN NEW.status = 'approved' THEN 'Votre compte a été approuvé. Vous pouvez maintenant effectuer des réservations.'
      WHEN NEW.status = 'rejected' THEN 'Votre compte a été rejeté. Veuillez contacter le support pour plus d''informations.'
      ELSE 'Le statut de votre compte a été mis à jour.'
    END,
    'document_status'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;