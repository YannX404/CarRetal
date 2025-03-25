/*
  # Fix admin approval function
  
  1. Changes
    - Remove explicit transaction handling
    - Add proper error handling
    - Ensure atomic updates
    
  2. Security
    - Function runs with SECURITY DEFINER
    - Maintain RLS policies
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS admin_approve_user(uuid);

-- Create function to approve user and documents
CREATE OR REPLACE FUNCTION admin_approve_user(user_id_param uuid)
RETURNS void AS $$
DECLARE
  v_user_exists boolean;
BEGIN
  -- Check if user exists
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = user_id_param
  ) INTO v_user_exists;

  IF NOT v_user_exists THEN
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

  -- Return success
  RETURN;
EXCEPTION WHEN OTHERS THEN
  -- Re-raise the error
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_approve_user(uuid) TO authenticated;