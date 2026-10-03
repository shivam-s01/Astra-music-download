-- Add optional 1-5 star rating to feedback
ALTER TABLE public.astra_comments
  ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating BETWEEN 1 AND 5);
