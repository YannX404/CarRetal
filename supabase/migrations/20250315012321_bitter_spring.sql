/*
  # Fix storage bucket configuration

  1. Changes
    - Make documents bucket public to allow public URLs
    - Update storage policies to maintain security while allowing public access

  2. Security
    - Drop existing policies to avoid conflicts
    - Create new policies for public read access
    - Maintain secure upload/delete policies
*/

-- Update the documents bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'documents';

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Create new policies with updated names to avoid conflicts
CREATE POLICY "Enable public document access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

CREATE POLICY "Enable document uploads for users"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Enable document deletion for users"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);