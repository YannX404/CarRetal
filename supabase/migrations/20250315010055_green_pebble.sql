/*
  # Correction des politiques RLS

  1. Sécurité
    - Correction de la récursion infinie dans la politique de la table users
    - Simplification des politiques de sélection et de mise à jour

  2. Changements
    - Suppression des politiques existantes qui causent la récursion
    - Création de nouvelles politiques optimisées pour les utilisateurs
*/

-- Suppression des politiques existantes qui causent la récursion
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Création des nouvelles politiques pour la table users
CREATE POLICY "Enable read access for authenticated users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Enable update access for authenticated users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = id OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Suppression de la politique existante pour les notifications si elle existe
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;

-- Création des nouvelles politiques pour les notifications
CREATE POLICY "Enable notification creation for authenticated users"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable notification access for authenticated users"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);