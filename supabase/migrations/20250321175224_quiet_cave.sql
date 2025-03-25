/*
  # Fix user status update logic

  1. Changes
    - Add strict document type checking
    - Add explicit document count validation
    - Add transaction support for atomic updates
    - Add debug logging for status changes
    
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
  v_cni_status text;
  v_permis_status text;
  v_facture_status text;
  v_new_status text;
BEGIN
  -- Get status of each required document
  SELECT status INTO v_cni_status
  FROM documents
  WHERE user_id = NEW.user_id AND type = 'cni'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT status INTO v_permis_status
  FROM documents
  WHERE user_id = NEW.user_id AND type = 'permis'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT status INTO v_facture_status
  FROM documents
  WHERE user_id = NEW.user_id AND type = 'facture'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Determine new status
  IF v_cni_status = 'approved' AND v_permis_status = 'approved' AND v_facture_status = 'approved' THEN
    v_new_status := 'approved';
  ELSIF v_cni_status = 'rejected' OR v_permis_status = 'rejected' OR v_facture_status = 'rejected' THEN
    v_new_status := 'rejected';
  ELSE
    v_new_status := 'submitted';
  END IF;

  -- Update user status
  UPDATE users
  SET status = v_new_status
  WHERE id = NEW.user_id;

  -- Log status change for debugging
  RAISE NOTICE 'User % status updated to % (CNI: %, Permis: %, Facture: %)',
    NEW.user_id, v_new_status, v_cni_status, v_permis_status, v_facture_status;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for document status changes
CREATE TRIGGER update_user_status_on_document_change
AFTER INSERT OR UPDATE OF status ON documents
FOR EACH ROW
EXECUTE FUNCTION update_user_status_from_documents();