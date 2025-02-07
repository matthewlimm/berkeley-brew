-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends Supabase auth)
CREATE TABLE public.profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE,
    username text UNIQUE,
    created_at timestamptz DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Cafes
CREATE TABLE public.cafes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    address text NOT NULL,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- Reviews
CREATE TABLE public.reviews (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    cafe_id uuid REFERENCES public.cafes ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    content text NOT NULL,
    rating numeric(2,1) CHECK (rating >= 0 AND rating <= 5),
    created_at timestamptz DEFAULT NOW(),
    UNIQUE(cafe_id, user_id)  -- One review per cafe per user
);

-- Basic RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Cafes policies
CREATE POLICY "Cafes are viewable by everyone"
    ON public.cafes FOR SELECT
    USING (true);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create reviews"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id);
