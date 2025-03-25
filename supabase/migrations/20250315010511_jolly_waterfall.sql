/*
  # Fix recursive policies

  1. Changes
    - Remove recursive role check in users policies
    - Add admin check using auth.jwt() instead of subquery
    - Fix notification policies to use proper syntax

  2. Security
    - Maintain RLS for users table
    - Keep admin access rights
    - Preserve user data privacy
*/

-- Suppression des politiques existantes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable user registration" ON users;
DROP POLICY IF EXISTS "Enable notification creation for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Enable notification access for authenticated users" ON notifications;

-- Nouvelles politiques pour la table users sans récursion
CREATE POLICY "Enable read access for authenticated users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Enable update access for authenticated users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    auth.jwt()->>'role' = 'admin'
  )
  WITH CHECK (
    auth.uid() = id OR 
    auth.jwt()->>'role' = 'admin'
  );

CREATE POLICY "Enable user registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND
    NOT EXISTS (
      SELECT 1 FROM users WHERE email = current_setting('request.jwt.claims')::json->>'email'
    )
  );

-- Politiques pour les notifications
CREATE POLICY "Enable notification creation"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable notification access"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);