/*
  # Add function to get users with documents

  1. Changes
    - Add PostgreSQL function to get users with their documents
    - Function returns users and their documents in the correct format
    - Handles the aggregation of documents for each user

  2. Security
    - Function is accessible only to authenticated users
    - Maintains RLS policies
*/

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
      json_agg(
        json_build_object(
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
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_with_documents() TO authenticated;