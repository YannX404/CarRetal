/*
  # Mise à jour du schéma pour l'authentification et les notifications

  1. Modifications des tables existantes
    - Mise à jour des politiques RLS pour les utilisateurs
    - Ajout de politiques RLS pour les notifications

  2. Sécurité
    - Mise à jour des politiques de sécurité pour les utilisateurs
    - Configuration des politiques pour les notifications
    - Ajout de la vérification du statut utilisateur pour les réservations

  3. Changements
    - Configuration des notifications
    - Ajout de la validation du statut utilisateur
*/

-- Mise à jour des politiques RLS pour les utilisateurs
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

CREATE POLICY "Users can read their own data"
ON users FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Mise à jour des politiques RLS pour les notifications
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can mark their notifications as read" ON notifications;

CREATE POLICY "Users can read their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can mark their notifications as read"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Fonction pour vérifier le statut de l'utilisateur
CREATE OR REPLACE FUNCTION check_user_status()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND status != 'approved'
  ) THEN
    RAISE EXCEPTION 'Votre compte doit être approuvé pour effectuer cette action.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour vérifier le statut de l'utilisateur avant une réservation
DROP TRIGGER IF EXISTS check_user_status_before_reservation ON reservations;

CREATE TRIGGER check_user_status_before_reservation
BEFORE INSERT ON reservations
FOR EACH ROW
EXECUTE FUNCTION check_user_status();