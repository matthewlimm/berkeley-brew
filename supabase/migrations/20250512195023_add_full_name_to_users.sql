-- Migration: Add full_name to users table
-- Description: Adds a full_name column to the users table

-- Up Migration
ALTER TABLE users ADD COLUMN full_name TEXT;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Down Migration (in case you need to roll back)
-- ALTER TABLE users DROP COLUMN full_name;
-- ALTER TABLE users DROP COLUMN updated_at;