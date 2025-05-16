-- Migration: Add RLS policy for users table
-- Description: Adds a row-level security policy to allow users to update their own profiles

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own profile
CREATE POLICY select_own_user ON users
  FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY update_own_user ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY insert_own_user ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policy to allow service role to access all users
CREATE POLICY service_role_select_users ON users
  FOR SELECT TO authenticated USING (true);

-- Create policy to allow service role to update all users
CREATE POLICY service_role_update_users ON users
  FOR UPDATE TO authenticated USING (true);

-- Create policy to allow service role to insert all users
CREATE POLICY service_role_insert_users ON users
  FOR INSERT TO authenticated WITH CHECK (true);
