-- Migration: Add latitude and longitude columns to cafes table
-- Run this migration in Supabase to enable geospatial distance sorting for cafes

ALTER TABLE cafes
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision;

-- Optionally, you can backfill these columns using a geocoding service after migration.
-- Example:
-- UPDATE cafes SET latitude = ..., longitude = ... WHERE id = ...;
