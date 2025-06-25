-- Add place_id column to cafes table
ALTER TABLE public.cafes ADD COLUMN place_id TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.cafes.place_id IS 'Google Places API ID for the cafe';

-- Create an index for faster lookups
CREATE INDEX idx_cafes_place_id ON public.cafes (place_id);
