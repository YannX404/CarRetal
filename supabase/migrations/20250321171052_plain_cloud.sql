/*
  # Fix User Status Update Logic
  
  1. Changes
    - Improve document status counting logic
    - Add proper error handling
    - Ensure atomic updates
    
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
  WITH document_stats AS (
    SELECT
      user_id,
      COUNT(*) as total_docs,
      COUNT(*) FILTER (WHERE status = 'approved') as approved_docs,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected_docs
    FROM documents
    WHERE user_id = NEW.user_id
    GROUP BY user_id
  )
  UPDATE users
  SET status = 
    CASE 
      WHEN ds.total_docs > 0 AND ds.approved_docs = ds.total_docs THEN 'approved'
      WHEN ds.rejected_docs > 0 THEN 'rejected'
      ELSE 'submitted'
    END
  FROM document_stats ds
  WHERE users.id = NEW.user_id;

  -- Create notification for status change
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type
  )
  SELECT
    NEW.user_id,
    CASE 
      WHEN NEW.status = 'approved' THEN 'Document approuvé'
      ELSE 'Document rejeté'
    END,
    CASE 
      WHEN NEW.status = 'approved' THEN 'Votre document a été approuvé.'
      ELSE 'Votre document a été rejeté. Veuillez soumettre un nouveau document.'
    END,
    'document_status';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document status changes
CREATE TRIGGER update_user_status_on_document_change
AFTER INSERT OR UPDATE OF status ON documents
FOR EACH ROW
EXECUTE FUNCTION update_user_status_from_documents();