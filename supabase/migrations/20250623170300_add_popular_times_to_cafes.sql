-- Add popular_times and popular_times_updated_at columns to cafes table

-- Check if columns already exist
DO $$
BEGIN
    -- Add popular_times column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='cafes' AND column_name='popular_times'
    ) THEN
        ALTER TABLE cafes ADD COLUMN popular_times JSONB;
    END IF;
    
    -- Add popular_times_updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='cafes' AND column_name='popular_times_updated_at'
    ) THEN
        ALTER TABLE cafes ADD COLUMN popular_times_updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;
