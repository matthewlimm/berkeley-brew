-- Add price_category and location columns to cafes table

-- Add price_category as an enum type
CREATE TYPE price_category AS ENUM ('$', '$$', '$$$');

-- Add location as an enum type
CREATE TYPE cafe_location AS ENUM ('northside', 'southside', 'downtown', 'outer');

-- Add the new columns to the cafes table
ALTER TABLE cafes
ADD COLUMN price_category price_category,
ADD COLUMN location cafe_location;

-- Create indexes for faster filtering
CREATE INDEX cafes_price_category_idx ON cafes(price_category);
CREATE INDEX cafes_location_idx ON cafes(location);

-- Update RLS policies if needed (assuming cafes table has RLS enabled)
-- No changes needed to existing RLS policies as these are just additional columns

-- Comment explaining the migration
COMMENT ON COLUMN cafes.price_category IS 'Price category of the cafe ($ to $$$)';
COMMENT ON COLUMN cafes.location IS 'Geographic location of the cafe relative to UC Berkeley campus';
