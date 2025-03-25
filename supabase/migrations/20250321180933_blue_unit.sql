/*
  # Fix user status update

  1. Changes
    - Add direct status update function
    - Add notification trigger for status changes
    - Improve document status handling

  2. Security
    - Maintain RLS policies
    - Keep security checks in place
*/

-- Create function to handle user status updates
CREATE OR REPLACE FUNCTION handle_user_status_update()
RETURNS trigger AS $$
BEGIN
  -- Create notification for status change
  IF NEW.status != OLD.status THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Compte approuvé'
        WHEN NEW.status = 'rejected' THEN 'Compte rejeté'
        ELSE 'Statut mis à jour'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Votre compte a été approuvé. Vous pouvez maintenant effectuer des réservations.'
        WHEN NEW.status = 'rejected' THEN 'Votre compte a été rejeté. Veuillez contacter le support pour plus d''informations.'
        ELSE 'Le statut de votre compte a été mis à jour.'
      END,
      'document_status'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user status changes
DROP TRIGGER IF EXISTS handle_user_status_update_trigger ON users;
CREATE TRIGGER handle_user_status_update_trigger
  AFTER UPDATE OF status ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_status_update();

-- Create function to handle document status updates
CREATE OR REPLACE FUNCTION handle_document_status_update()
RETURNS trigger AS $$
DECLARE
  v_doc_count integer;
  v_approved_count integer;
  v_rejected_count integer;
BEGIN
  -- Get document counts for the user
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

  -- Update user status based on document counts
  UPDATE users
  SET status = (
    CASE
      WHEN v_doc_count = 3 AND v_approved_count = 3 THEN 'approved'
      WHEN v_rejected_count > 0 THEN 'rejected'
      WHEN v_doc_count > 0 THEN 'submitted'
      ELSE 'pending'
    END
  )
  WHERE id = NEW.user_id;

  -- Create notification for document status change
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type
  ) VALUES (
    NEW.user_id,
    CASE 
      WHEN NEW.status = 'approved' THEN 'Document approuvé'
      ELSE 'Document rejeté'
    END,
    CASE 
      WHEN NEW.status = 'approved' THEN 'Votre document a été approuvé.'
      ELSE 'Votre document a été rejeté. Veuillez soumettre un nouveau document.'
    END,
    'document_status'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document status changes
DROP TRIGGER IF EXISTS handle_document_status_update_trigger ON documents;
CREATE TRIGGER handle_document_status_update_trigger
  AFTER UPDATE OF status ON documents
  FOR EACH ROW
  EXECUTE FUNCTION handle_document_status_update();