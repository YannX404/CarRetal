/*
  # Fix notification policies

  1. Changes
    - Update notification policies to allow admins to create notifications for any user
    - Keep existing policies for users to manage their own notifications

  2. Security
    - Maintain RLS for notifications table
    - Allow admins full access
    - Preserve user data privacy
*/

-- Drop existing notification policies
DROP POLICY IF EXISTS "Enable notification creation" ON notifications;
DROP POLICY IF EXISTS "Enable notification access" ON notifications;
DROP POLICY IF EXISTS "Enable notification creation for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Enable notification access for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Users can mark their notifications as read" ON notifications;

-- Create new notification policies
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );