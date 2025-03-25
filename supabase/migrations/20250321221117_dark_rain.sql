/*
  # Fix admin approval function transaction handling
  
  1. Changes
    - Remove explicit transaction handling
    - Simplify function to avoid transaction issues
    - Keep atomic updates
    
  2. Security
    - Function runs with SECURITY DEFINER
    - Maintain RLS policies
*/

-- Drop existing function
DROP FUNCTION IF EXISTS admin_approve_user(uuid);

-- Create improved function without explicit transaction handling
CREATE OR REPLACE FUNCTION admin_approve_user(user_id_param uuid)
RETURNS void AS $$
BEGIN
  -- Update user status to approved
  UPDATE users
  SET status = 'approved'
  WHERE id = user_id_param;

  -- Update all documents to approved
  UPDATE documents
  SET status = 'approved'
  WHERE user_id = user_id_param;

  -- Create notification
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type
  ) VALUES (
    user_id_param,
    'Compte approuvé',
    'Votre compte et vos documents ont été approuvés. Vous pouvez maintenant effectuer des réservations.',
    'document_status'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_approve_user(uuid) TO authenticated;