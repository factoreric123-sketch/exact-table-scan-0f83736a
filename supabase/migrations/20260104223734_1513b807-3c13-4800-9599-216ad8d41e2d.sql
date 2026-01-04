-- Add layout_style column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS layout_style TEXT DEFAULT 'generic';