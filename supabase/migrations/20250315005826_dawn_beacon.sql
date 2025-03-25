/*
  # Ajout de la politique d'insertion pour la table users

  1. Sécurité
    - Ajoute une politique permettant aux utilisateurs de s'insérer dans la table users
    - L'ID de l'utilisateur doit correspondre à l'ID d'authentification
*/

CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);