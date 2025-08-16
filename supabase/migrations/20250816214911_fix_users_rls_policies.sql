-- Fix RLS policies for users table to properly handle service role
-- The service role should bypass all RLS policies

-- Drop existing problematic service role policies
DROP POLICY IF EXISTS service_role_select_users ON users;
DROP POLICY IF EXISTS service_role_update_users ON users;
DROP POLICY IF EXISTS service_role_insert_users ON users;

-- Create policies that specifically target the service_role
CREATE POLICY service_role_all_users ON users
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also allow anon role for unauthenticated access (if needed)
CREATE POLICY anon_role_all_users ON users
  TO anon
  USING (true)
  WITH CHECK (true);

-- Ensure existing user-level policies remain for regular users
-- These should already exist but let's make sure they're correct
DROP POLICY IF EXISTS select_own_user ON users;
DROP POLICY IF EXISTS update_own_user ON users;  
DROP POLICY IF EXISTS insert_own_user ON users;

CREATE POLICY select_own_user ON users
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY update_own_user ON users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY insert_own_user ON users
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);
