-- Add golden_bear_score column to reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS golden_bear_score NUMERIC(2,1) CHECK (golden_bear_score >= 0 AND golden_bear_score <= 5);

-- Update existing reviews with calculated golden_bear_score
UPDATE public.reviews
SET golden_bear_score = (
  COALESCE(grindability_score, 0) + 
  COALESCE(student_friendliness_score, 0) + 
  COALESCE(coffee_quality_score, 0) + 
  COALESCE(vibe_score, 0)
) / 
NULLIF(
  (CASE WHEN grindability_score IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN student_friendliness_score IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN coffee_quality_score IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN vibe_score IS NOT NULL THEN 1 ELSE 0 END),
  0
)
WHERE golden_bear_score IS NULL;

-- Update the trigger function to also set golden_bear_score in reviews
CREATE OR REPLACE FUNCTION update_review_golden_bear_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate and set the golden_bear_score for the review
  NEW.golden_bear_score := (
    COALESCE(NEW.grindability_score, 0) + 
    COALESCE(NEW.student_friendliness_score, 0) + 
    COALESCE(NEW.coffee_quality_score, 0) + 
    COALESCE(NEW.vibe_score, 0)
  ) / 
  NULLIF(
    (CASE WHEN NEW.grindability_score IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.student_friendliness_score IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.coffee_quality_score IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.vibe_score IS NOT NULL THEN 1 ELSE 0 END),
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set golden_bear_score before insert or update
DROP TRIGGER IF EXISTS reviews_set_golden_bear_score_trigger ON public.reviews;
CREATE TRIGGER reviews_set_golden_bear_score_trigger
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_review_golden_bear_score();
