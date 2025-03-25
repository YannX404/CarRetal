/*
  # Fix user status update trigger

  1. Changes
    - Simplify user status update logic
    - Fix trigger to properly update user status when documents are approved/rejected
    - Add direct status update function for admin actions

  2. Security
    - Maintain RLS policies
    - Keep security checks in place
*/

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS update_user_status_on_document_change ON documents;
DROP FUNCTION IF EXISTS update_user_status_from_documents();

-- Create function to update user status from documents
CREATE OR REPLACE FUNCTION update_user_status_from_documents()
RETURNS trigger AS $$
DECLARE
  v_doc_count integer;
  v_approved_count integer;
  v_rejected_count integer;
  v_current_status text;
BEGIN
  -- Get current user status
  SELECT status INTO v_current_status
  FROM users
  WHERE id = NEW.user_id;

  -- Get document counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO 
    v_doc_count,
    v_approved_count,
    v_rejected_count
  FROM documents
  WHERE user_id = NEW.user_id
  AND type IN ('cni', 'permis', 'facture');

  -- Update user status
  UPDATE users
  SET status = (
    CASE
      -- All required documents are approved
      WHEN v_doc_count = 3 AND v_approved_count = 3 THEN 'approved'
      -- Any document is rejected
      WHEN v_rejected_count > 0 THEN 'rejected'
      -- Has at least one document
      WHEN v_doc_count > 0 THEN 'submitted'
      -- No documents
      ELSE 'pending'
    END
  )
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document changes
CREATE TRIGGER update_user_status_on_document_change
AFTER INSERT OR UPDATE OF status ON documents
FOR EACH ROW
EXECUTE FUNCTION update_user_status_from_documents();

-- Create function for direct status updates by admin
CREATE OR REPLACE FUNCTION admin_update_user_status(user_id uuid, new_status text)
RETURNS void AS $$
BEGIN
  -- Update user status directly
  UPDATE users
  SET status = new_status
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;