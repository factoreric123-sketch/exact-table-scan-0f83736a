-- Add force_two_decimals setting to restaurants table
-- Default is false (show prices as entered)
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS force_two_decimals boolean DEFAULT false;