/*
  # Fix user approval logic
  
  1. Changes
    - Add function to approve all user documents when account is approved
    - Update handle_user_status_update trigger to approve documents
    - Fix notification handling
    
  2. Security
    - Function runs with SECURITY DEFINER
    - Maintains RLS policies
*/

-- Create or replace the function to handle user status updates
CREATE OR REPLACE FUNCTION handle_user_status_update()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if status has changed
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- If status is changed to approved, approve all documents
  IF NEW.status = 'approved' THEN
    -- Update all documents to approved
    UPDATE documents
    SET status = 'approved'
    WHERE user_id = NEW.id;
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

-- Update the admin_approve_user function to approve documents
CREATE OR REPLACE FUNCTION admin_approve_user(user_id_param uuid)
RETURNS void AS $$
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id_param) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update user status to approved
  UPDATE users
  SET status = 'approved'
  WHERE id = user_id_param;

  -- Update all documents to approved
  UPDATE documents
  SET status = 'approved'
  WHERE user_id = user_id_param;

  -- Create notification for the user
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type
  ) VALUES (
    user_id_param,
    'Compte approuvé',
    'Votre compte a été approuvé. Vous pouvez maintenant effectuer des réservations.',
    'document_status'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_approve_user(uuid) TO authenticated;