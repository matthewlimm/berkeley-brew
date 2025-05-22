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

--Create enum for level types for crowdsourced data 
CREATE TYPE public.amenity_type AS ENUM (
    'low', 
    'medium',
    'high'
);


-- --Cafe information with crowd-sourced data
-- CREATE TABLE public.cafes_realtime_data(
--     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
--     cafe_id UUID REFERENCES cafes.cafe_id on DEFAULT CASCADE, 
--     user_id UUID REFERENCES auth.users ON DELETE CASCADE,
--     wifi_availability amenity_type not null,
--     outlet_availability amenity_type not null, 
--     seating amenity_type not null, 
--     seating amenity_type not null DEFAULT 'medium'
-- )




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
CREATE TABLE public.posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('recipe', 'guide')),
    brew_method TEXT NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level >= 0 AND difficulty_level <= 5),
    prep_time INTEGER NOT NULL,
    ingredients TEXT[],
    author_id UUID REFERENCES auth.users ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

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

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
    ON public.posts FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can create posts"
    ON public.posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = author_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can create reviews"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id);