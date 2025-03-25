/*
  # Improve admin approval function
  
  1. Changes
    - Add function to approve both user and documents in one transaction
    - Add function to get user status by email
    - Ensure atomic updates
    
  2. Security
    - Functions run with SECURITY DEFINER
    - Maintain RLS policies
*/

-- Create function to get user by email
CREATE OR REPLACE FUNCTION get_user_by_email(email_param text)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.full_name, u.status
  FROM users u
  WHERE u.email = email_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the admin_approve_user function to approve documents
CREATE OR REPLACE FUNCTION admin_approve_user(user_id_param uuid)
RETURNS void AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id_param) THEN
      RAISE EXCEPTION 'User not found';
    END IF;

    -- Update all documents to approved first
    UPDATE documents
    SET status = 'approved'
    WHERE user_id = user_id_param;

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
      'Votre compte et vos documents ont été approuvés. Vous pouvez maintenant effectuer des réservations.',
      'document_status'
    );

    -- Commit transaction
    COMMIT;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback on error
    ROLLBACK;
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_approve_user(uuid) TO authenticated;

-- Example usage:
-- SELECT * FROM get_user_by_email('toto@gmail.com');
-- SELECT admin_approve_user('46ea3ac5-2fc7-4d08-bde2-fa02012290cb');