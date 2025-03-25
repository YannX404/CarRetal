/*
  # Improve admin approval function
  
  1. Changes
    - Simplify admin approval function to match manual approach
    - Add direct status update like manual SQL
    - Keep document approval synchronized
    
  2. Security
    - Function runs with SECURITY DEFINER
    - Maintain RLS policies
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS admin_approve_user(uuid);
DROP FUNCTION IF EXISTS get_user_by_email(text);

-- Create simplified function to get user by email (exactly like manual SQL)
CREATE OR REPLACE FUNCTION get_user_by_email(email_param text)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  status text
) AS $$
BEGIN
  -- This matches exactly your manual query
  RETURN QUERY
  SELECT u.id, u.email, u.full_name, u.status
  FROM users u
  WHERE u.email = email_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simplified function to approve user (exactly like manual SQL)
CREATE OR REPLACE FUNCTION admin_approve_user(user_id_param uuid)
RETURNS void AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- This matches exactly your manual UPDATE query
    UPDATE users
    SET status = 'approved'
    WHERE id = user_id_param;

    -- Also approve all documents
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

-- Example usage (exactly like your manual queries):
-- SELECT * FROM get_user_by_email('toto@gmail.com');
-- SELECT admin_approve_user('46ea3ac5-2fc7-4d08-bde2-fa02012290cb');