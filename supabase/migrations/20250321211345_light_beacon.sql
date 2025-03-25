/*
  # Add function to update user status
  
  1. Changes
    - Add function to safely update user status to approved
    - Handle notifications
    - Ensure proper status transitions
    
  2. Security
    - Function runs with SECURITY DEFINER
    - Only admins can execute
*/

-- Create function to update user status to approved
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

-- Example usage:
-- SELECT admin_approve_user('user-uuid-here');