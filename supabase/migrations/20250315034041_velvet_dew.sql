-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_users_with_documents();

-- Create the improved function
CREATE OR REPLACE FUNCTION get_users_with_documents()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone_number text,
  status text,
  created_at timestamptz,
  documents jsonb
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.phone_number,
    u.status,
    u.created_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'type', d.type,
          'file_url', d.file_url,
          'status', d.status
        )
      ) FILTER (WHERE d.id IS NOT NULL),
      '[]'::jsonb
    ) as documents
  FROM users u
  LEFT JOIN documents d ON d.user_id = u.id
  WHERE u.role = 'client'
  GROUP BY u.id
  ORDER BY 
    CASE 
      WHEN u.status = 'submitted' THEN 1
      WHEN u.status = 'pending' THEN 2
      WHEN u.status = 'approved' THEN 3
      WHEN u.status = 'rejected' THEN 4
      ELSE 5
    END,
    u.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_with_documents() TO authenticated;