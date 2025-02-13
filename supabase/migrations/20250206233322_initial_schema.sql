-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (extends Supabase auth)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Cafes
-- need to change this for the things we specified in the design doc
CREATE TABLE public.cafes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    --need to add image, 
);

-- Reviews
CREATE TABLE public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cafe_id UUID REFERENCES public.cafes ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cafe_id, user_id)  -- One review per cafe per user
);

-- Posts
CREATE TABLE public.coffeePost (
    id UUID DEFAULT uuid_generate_v4 PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- maybe like a caption
    type text not null check (type in ('recipe', 'guide')),
    author_id UUID REFERENCES auth.users not null, 
    brew_method text, 
    difficulty_level NUMERIC(2,1) CHECK (rating >= 0 and rating <= 5), 
    prep_time integer, 
    ingredients TEXT[], 
    created_at TIMESTAMPTZ DEFAULT NOW(), 
)


-- Basic RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffeePost ENABLE ROW LEVEL SECURITY;


-- Users policies
CREATE POLICY "Public users are viewable by everyone"
    ON public.users FOR SELECT
    USING (TRUE);

CREATE POLICY "Users can insert their own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Cafes policies
CREATE POLICY "Cafes are viewable by everyone"
    ON public.cafes FOR SELECT
    USING (TRUE);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (TRUE);

-- Coffee Posts policies
-- Might want to modify this for just followers in the future
CREATE POLICY "Posts are viewable by everyone"
    ON public.coffeePost FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can create reviews"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id);
