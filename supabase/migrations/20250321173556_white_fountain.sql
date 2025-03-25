/*
  # Fix user status update logic

  1. Changes
    - Simplify status update logic
    - Add explicit checks for required documents
    - Fix document counting logic
    - Remove notification handling (handled in admin page)
    
  2. Security
    - Function runs with SECURITY DEFINER
    - Maintains RLS policies
*/

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS update_user_status_on_document_change ON documents;
DROP FUNCTION IF EXISTS update_user_status_from_documents();

-- Create improved function to update user status
CREATE OR REPLACE FUNCTION update_user_status_from_documents()
RETURNS trigger AS $$
BEGIN
  -- Update user status based on their documents
  UPDATE users u
  SET status = (
    SELECT
      CASE
        -- All 3 required documents are approved
        WHEN (
          SELECT COUNT(*)
          FROM documents d
          WHERE d.user_id = NEW.user_id
          AND d.status = 'approved'
          AND d.type IN ('cni', 'permis', 'facture')
        ) = 3 THEN 'approved'
        
        -- Any document is rejected
        WHEN EXISTS (
          SELECT 1
          FROM documents d
          WHERE d.user_id = NEW.user_id
          AND d.status = 'rejected'
        ) THEN 'rejected'
        
        -- Has documents but not all approved/rejected
        WHEN EXISTS (
          SELECT 1
          FROM documents d
          WHERE d.user_id = NEW.user_id
        ) THEN 'submitted'
        
        -- No documents
        ELSE 'pending'
      END
  )
  WHERE u.id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document status changes
CREATE TRIGGER update_user_status_on_document_change
AFTER INSERT OR UPDATE OF status ON documents
FOR EACH ROW
EXECUTE FUNCTION update_user_status_from_documents();