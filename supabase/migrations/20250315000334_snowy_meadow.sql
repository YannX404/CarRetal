/*
  # Schéma initial pour le site de location de voitures WilkaDeals

  1. Tables Principales
    - `users` : Informations des utilisateurs et clients
      - `id` (uuid, clé primaire)
      - `email` (text, unique)
      - `full_name` (text)
      - `phone_number` (text)
      - `role` (text) : 'client' ou 'admin'
      - `status` (text) : 'pending', 'submitted', 'approved', 'rejected'
      - `created_at` (timestamp)
      
    - `documents` : Documents requis des clients
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence users)
      - `type` (text) : 'cni', 'permis', 'facture'
      - `file_url` (text)
      - `status` (text) : 'pending', 'approved', 'rejected'
      - `created_at` (timestamp)

    - `vehicles` : Catalogue des véhicules
      - `id` (uuid, clé primaire)
      - `name` (text)
      - `model` (text)
      - `price_per_day` (integer)
      - `image_url` (text)
      - `available` (boolean)
      - `created_at` (timestamp)

    - `delivery_locations` : Points de livraison
      - `id` (uuid, clé primaire)
      - `name` (text)
      - `price` (integer)
      - `created_at` (timestamp)

    - `reservations` : Réservations des véhicules
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence users)
      - `vehicle_id` (uuid, référence vehicles)
      - `start_date` (date)
      - `end_date` (date)
      - `delivery_location_id` (uuid, référence delivery_locations, nullable)
      - `total_price` (integer)
      - `deposit_status` (text) : 'pending', 'received'
      - `receipt_url` (text, nullable)
      - `created_at` (timestamp)

    - `notifications` : Système de notifications
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence users)
      - `title` (text)
      - `message` (text)
      - `type` (text) : 'welcome', 'document_status', 'reservation', 'receipt'
      - `read` (boolean)
      - `created_at` (timestamp)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques spécifiques pour clients et admins
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  role text NOT NULL DEFAULT 'client',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('client', 'admin')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'submitted', 'approved', 'rejected'))
);

-- Documents table
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_type CHECK (type IN ('cni', 'permis', 'facture')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Vehicles table
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  model text NOT NULL,
  price_per_day integer NOT NULL,
  image_url text,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Delivery locations table
CREATE TABLE delivery_locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  price integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Reservations table
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  delivery_location_id uuid REFERENCES delivery_locations(id),
  total_price integer NOT NULL,
  deposit_status text NOT NULL DEFAULT 'pending',
  receipt_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_deposit_status CHECK (deposit_status IN ('pending', 'received'))
);

-- Notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_type CHECK (type IN ('welcome', 'document_status', 'reservation', 'receipt'))
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR role = 'admin');

-- Policies for documents
CREATE POLICY "Users can read their own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create their own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policies for vehicles
CREATE POLICY "Anyone can read vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Policies for delivery locations
CREATE POLICY "Anyone can read delivery locations"
  ON delivery_locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify delivery locations"
  ON delivery_locations
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Policies for reservations
CREATE POLICY "Users can read their own reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can create their own reservations"
  ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policies for notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Insert initial delivery locations
INSERT INTO delivery_locations (name, price) VALUES
  ('Cocody', 5000),
  ('Marcory', 10000),
  ('Yopougon', 10000),
  ('Bassam', 15000);