-- Add new columns to cafes table
ALTER TABLE public.cafes 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS grindability_score NUMERIC(2,1) CHECK (grindability_score >= 0 AND grindability_score <= 5),
ADD COLUMN IF NOT EXISTS student_friendliness_score NUMERIC(2,1) CHECK (student_friendliness_score >= 0 AND student_friendliness_score <= 5),
ADD COLUMN IF NOT EXISTS coffee_quality_score NUMERIC(2,1) CHECK (coffee_quality_score >= 0 AND coffee_quality_score <= 5),
ADD COLUMN IF NOT EXISTS vibe_score NUMERIC(2,1) CHECK (vibe_score >= 0 AND vibe_score <= 5),
ADD COLUMN IF NOT EXISTS golden_bear_score NUMERIC(2,1) CHECK (golden_bear_score >= 0 AND golden_bear_score <= 5);

-- Update existing cafes with sample data
UPDATE public.cafes
SET 
  image_url = CASE 
    WHEN name ILIKE '%strada%' THEN 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
    WHEN name ILIKE '%1951%' THEN 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
    WHEN name ILIKE '%yali%' THEN 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
    WHEN name ILIKE '%equator%' THEN 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
    WHEN name ILIKE '%souvenir%' THEN 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
    ELSE 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
  END,
  grindability_score = ROUND((RANDOM() * 4 + 1)::numeric, 1),
  student_friendliness_score = ROUND((RANDOM() * 4 + 1)::numeric, 1),
  coffee_quality_score = ROUND((RANDOM() * 4 + 1)::numeric, 1),
  vibe_score = ROUND((RANDOM() * 4 + 1)::numeric, 1),
  golden_bear_score = ROUND((
    COALESCE(grindability_score, 0) + 
    COALESCE(student_friendliness_score, 0) + 
    COALESCE(coffee_quality_score, 0) + 
    COALESCE(vibe_score, 0)
  ) / 4, 1);

-- Add subscores to reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS grindability_score NUMERIC(2,1) CHECK (grindability_score >= 0 AND grindability_score <= 5),
ADD COLUMN IF NOT EXISTS student_friendliness_score NUMERIC(2,1) CHECK (student_friendliness_score >= 0 AND student_friendliness_score <= 5),
ADD COLUMN IF NOT EXISTS coffee_quality_score NUMERIC(2,1) CHECK (coffee_quality_score >= 0 AND coffee_quality_score <= 5),
ADD COLUMN IF NOT EXISTS vibe_score NUMERIC(2,1) CHECK (vibe_score >= 0 AND vibe_score <= 5);

-- Create a trigger function to update cafe scores when reviews are added/updated/deleted
CREATE OR REPLACE FUNCTION update_cafe_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the individual scores for the cafe
  WITH avg_scores AS (
    SELECT 
      cafe_id,
      AVG(grindability_score) AS avg_grindability,
      AVG(student_friendliness_score) AS avg_student_friendliness,
      AVG(coffee_quality_score) AS avg_coffee_quality,
      AVG(vibe_score) AS avg_vibe
    FROM public.reviews
    WHERE cafe_id = COALESCE(NEW.cafe_id, OLD.cafe_id)
    GROUP BY cafe_id
  )
  UPDATE public.cafes c
  SET 
    grindability_score = s.avg_grindability,
    student_friendliness_score = s.avg_student_friendliness,
    coffee_quality_score = s.avg_coffee_quality,
    vibe_score = s.avg_vibe,
    golden_bear_score = (
      COALESCE(s.avg_grindability, 0) + 
      COALESCE(s.avg_student_friendliness, 0) + 
      COALESCE(s.avg_coffee_quality, 0) + 
      COALESCE(s.avg_vibe, 0)
    ) / 
    NULLIF(
      (CASE WHEN s.avg_grindability IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN s.avg_student_friendliness IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN s.avg_coffee_quality IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN s.avg_vibe IS NOT NULL THEN 1 ELSE 0 END),
      0
    )
  FROM avg_scores s
  WHERE c.id = s.cafe_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for reviews table
DROP TRIGGER IF EXISTS reviews_insert_update_trigger ON public.reviews;
CREATE TRIGGER reviews_insert_update_trigger
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_cafe_scores();

DROP TRIGGER IF EXISTS reviews_delete_trigger ON public.reviews;
CREATE TRIGGER reviews_delete_trigger
AFTER DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_cafe_scores();

-- Fix the cafes_realtime_data table which had a duplicate seating field in the initial schema
-- First check if the table exists and has the duplicate column
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'cafes_realtime_data' 
    AND column_name = 'seating'
  ) THEN
    -- Drop the duplicate seating column if it exists
    ALTER TABLE public.cafes_realtime_data DROP COLUMN IF EXISTS seating;
  END IF;
END $$;

-- Fix the reference to cafes.cafe_id which should be public.cafes(id)
-- First check if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'cafes_realtime_data'
  ) THEN
    -- Drop the constraint if it exists
    ALTER TABLE public.cafes_realtime_data 
    DROP CONSTRAINT IF EXISTS cafes_realtime_data_cafe_id_fkey;
    
    -- Add the correct constraint
    ALTER TABLE public.cafes_realtime_data
    ADD CONSTRAINT cafes_realtime_data_cafe_id_fkey 
    FOREIGN KEY (cafe_id) REFERENCES public.cafes(id) ON DELETE CASCADE;
  END IF;
END $$;
