-- Create posts table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE public.post (
    id UUID DEFAULT (uuid_generate_v4()) PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('recipe', 'guide')),
    author_id UUID REFERENCES auth.users NOT NULL,
    brew_method TEXT,
    difficulty_level NUMERIC(2,1) CHECK (difficulty_level >= 0 AND difficulty_level <= 5),
    prep_time INTEGER,
    ingredients TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the function for updating timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.post
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.post ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
    ON public.post FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can create posts"
    ON public.post FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
    ON public.post FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
    ON public.post FOR DELETE
    USING (auth.uid() = author_id);
