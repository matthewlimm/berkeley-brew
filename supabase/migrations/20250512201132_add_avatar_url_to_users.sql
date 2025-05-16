-- Migration: Add avatar_url to users table
-- Description: Adds an avatar_url column to the users table

-- Up Migration
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Down Migration (in case you need to roll back)
-- ALTER TABLE users DROP COLUMN avatar_url;
