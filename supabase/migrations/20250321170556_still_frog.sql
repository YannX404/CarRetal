/*
  # Automatic User Status Updates
  
  1. Changes
    - Add function to automatically update user status based on document statuses
    - Add trigger to execute the function when document status changes
    
  2. Logic
    - If all documents are approved -> user status = 'approved'
    - If any document is rejected -> user status = 'rejected'
    - Otherwise -> user status = 'submitted'
    
  3. Security
    - Function runs with SECURITY DEFINER to ensure proper permissions
*/

-- Create function to update user status based on document statuses
CREATE OR REPLACE FUNCTION update_user_status_from_documents()
RETURNS trigger AS $$
DECLARE
  doc_count integer;
  approved_count integer;
  rejected_count integer;
  new_status text;
BEGIN
  -- Get counts of documents for this user
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO 
    doc_count,
    approved_count,
    rejected_count
  FROM documents
  WHERE user_id = NEW.user_id;

  -- Determine new user status
  IF doc_count > 0 AND approved_count = doc_count THEN
    new_status := 'approved';
  ELSIF rejected_count > 0 THEN
    new_status := 'rejected';
  ELSE
    new_status := 'submitted';
  END IF;

  -- Update user status
  UPDATE users
  SET status = new_status
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_status_on_document_change ON documents;

-- Create trigger to update user status when document status changes
CREATE TRIGGER update_user_status_on_document_change
  AFTER INSERT OR UPDATE OF status
  ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_user_status_from_documents();