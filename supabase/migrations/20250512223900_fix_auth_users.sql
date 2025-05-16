-- This migration ensures the auth schema and users table are properly configured
-- It also adds any missing columns that might be needed for user metadata

-- First, make sure the auth extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a public.profiles table that will store user profile information
-- This is separate from the auth.users table and avoids conflicts
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies to the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view any profile
CREATE POLICY "Anyone can view profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create a trigger to create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
