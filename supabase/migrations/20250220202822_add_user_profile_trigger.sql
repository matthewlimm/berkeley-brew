-- Migration: Add automatic user profile creation trigger
-- Description: Sets up a trigger to automatically create user profiles when new users sign up

-- TODO: Review current schema
-- [ ] Verify public.users table structure
-- [ ] Check required fields
-- [ ] Verify foreign key relationships

-- TODO: Implement trigger function
-- [ ] Function should:
--     - Create profile in public.users
--     - Copy necessary fields from auth.users
--     - Set default values for required fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- TODO: Customize fields based on your users table structure
  INSERT INTO public.users (
    id,  -- Required: matches auth.users.id
    email  -- Optional: from auth.users.email
    -- Add additional fields as needed:
    -- full_name,
    -- avatar_url,
    -- etc.
  )
  VALUES (
    NEW.id,  -- NEW refers to the newly created auth.users record
    NEW.email
    -- Add values for additional fields
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TODO: Create the trigger
-- [ ] Should run after INSERT on auth.users
-- [ ] Verify SECURITY DEFINER permissions
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- TODO: Add policies for the users table
-- [ ] Users should be able to read their own profile
-- [ ] Users should be able to update their own profile
-- [ ] Consider what fields should be publicly readable

-- Example policies (uncomment and modify as needed):
/*
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Optional: Allow public read access to specific fields
CREATE POLICY "Public can view basic profile info"
    ON public.users FOR SELECT
    USING (true);
*/

-- TODO: Test implementation
-- [ ] Test cases to verify:
--     1. New user signup -> profile created
--     2. All required fields populated
--     3. RLS policies working
--     4. Foreign key constraints maintained

-- TODO: Rollback section
-- In case we need to revert these changes:
/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- Remove any added policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.users;
*/
