-- Drop the existing table if it exists
DROP TABLE IF EXISTS public.cafes_realtime_data;

-- Drop the enum type if it exists
DROP TYPE IF EXISTS public.amenity_type;

-- Recreate the enum type
CREATE TYPE public.amenity_type AS ENUM (
    'low', 
    'medium',
    'high'
);

-- Create the fixed cafes_realtime_data table
CREATE TABLE public.cafes_realtime_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    wifi_availability amenity_type NOT NULL,
    outlet_availability amenity_type NOT NULL,
    seating amenity_type NOT NULL DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.cafes_realtime_data ENABLE ROW LEVEL SECURITY;

-- Everyone can view the realtime data
CREATE POLICY "Realtime data is viewable by everyone"
    ON public.cafes_realtime_data FOR SELECT
    USING (true);

-- Users can insert their own realtime data
CREATE POLICY "Users can insert their own realtime data"
    ON public.cafes_realtime_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own realtime data
CREATE POLICY "Users can update their own realtime data"
    ON public.cafes_realtime_data FOR UPDATE
    USING (auth.uid() = user_id);

-- Add trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cafes_realtime_data_updated_at
    BEFORE UPDATE ON public.cafes_realtime_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
