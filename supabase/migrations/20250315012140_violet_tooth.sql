/*
  # Add unique constraint to documents table

  1. Changes
    - Add unique constraint on user_id and type columns in documents table
    - This enables the ON CONFLICT (user_id, type) functionality

  2. Security
    - No changes to RLS policies
*/

-- Add unique constraint for user_id and type combination
ALTER TABLE documents
ADD CONSTRAINT documents_user_id_type_key UNIQUE (user_id, type);