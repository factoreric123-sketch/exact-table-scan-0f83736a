-- Add allergen and dietary restriction fields to dishes table
ALTER TABLE public.dishes 
ADD COLUMN allergens TEXT[] DEFAULT '{}',
ADD COLUMN calories INTEGER,
ADD COLUMN is_vegetarian BOOLEAN DEFAULT false,
ADD COLUMN is_vegan BOOLEAN DEFAULT false,
ADD COLUMN is_spicy BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.dishes.allergens IS 'Array of allergen tags: gluten, dairy, eggs, fish, shellfish, nuts, soy, pork, beef, poultry';
COMMENT ON COLUMN public.dishes.calories IS 'Calorie count for the dish';
COMMENT ON COLUMN public.dishes.is_vegetarian IS 'Whether the dish is vegetarian';
COMMENT ON COLUMN public.dishes.is_vegan IS 'Whether the dish is vegan';
COMMENT ON COLUMN public.dishes.is_spicy IS 'Whether the dish is spicy';