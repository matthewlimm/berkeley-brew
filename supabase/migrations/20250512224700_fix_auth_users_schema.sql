-- Fix the users table schema to work better with Supabase Auth
-- This migration makes the id field optional during insert operations

-- First, let's make sure the users table exists
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view any profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create policies that allow proper access
CREATE POLICY "Users can view any profile"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Create a function to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    username = COALESCE(EXCLUDED.username, public.users.username),
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
