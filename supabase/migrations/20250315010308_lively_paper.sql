/*
  # Correction de la politique d'insertion des utilisateurs

  1. Sécurité
    - Ajout d'une vérification de l'unicité de l'email avant l'insertion
    - Modification de la politique d'insertion pour éviter les doublons

  2. Changements
    - Suppression de l'ancienne politique d'insertion
    - Création d'une nouvelle politique avec vérification de l'email
*/

-- Suppression de la politique existante
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

-- Création de la nouvelle politique avec vérification de l'email
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