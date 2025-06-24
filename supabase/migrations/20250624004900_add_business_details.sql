-- Add business details columns to cafes table
ALTER TABLE cafes
ADD COLUMN IF NOT EXISTS business_hours JSONB,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add comment to explain the business_hours format
COMMENT ON COLUMN cafes.business_hours IS 'JSON object containing business hours in Google Maps format';
COMMENT ON COLUMN cafes.phone_number IS 'Formatted phone number for the cafe';
COMMENT ON COLUMN cafes.website_url IS 'Website URL for the cafe';
