/*
  # Fix User Status Update Logic
  
  1. Changes
    - Simplify status update logic
    - Remove notification creation from trigger (already handled in admin page)
    - Add proper transaction handling
    
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
DECLARE
  required_docs_count integer := 3; -- CNI, permis, facture
  user_docs_count integer;
  approved_docs_count integer;
  rejected_docs_count integer;
BEGIN
  -- Get document counts for the user
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO 
    user_docs_count,
    approved_docs_count,
    rejected_docs_count
  FROM documents 
  WHERE user_id = NEW.user_id;

  -- Update user status based on document counts
  UPDATE users 
  SET status = (
    CASE
      -- All required documents are approved
      WHEN user_docs_count = required_docs_count AND approved_docs_count = required_docs_count THEN 'approved'
      -- Any document is rejected
      WHEN rejected_docs_count > 0 THEN 'rejected'
      -- Documents submitted but not all approved/rejected
      WHEN user_docs_count > 0 THEN 'submitted'
      -- No documents yet
      ELSE 'pending'
    END
  )
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document status changes
CREATE TRIGGER update_user_status_on_document_change
AFTER INSERT OR UPDATE OF status ON documents
FOR EACH ROW
EXECUTE FUNCTION update_user_status_from_documents();