-- Add restaurant_id directly to dishes table for faster RLS checks
-- This is a denormalization for performance

-- Step 1: Add the restaurant_id column
ALTER TABLE public.dishes 
ADD COLUMN IF NOT EXISTS restaurant_id uuid;

-- Step 2: Populate restaurant_id from existing relationships
UPDATE public.dishes d
SET restaurant_id = (
  SELECT c.restaurant_id 
  FROM subcategories s 
  JOIN categories c ON c.id = s.category_id 
  WHERE s.id = d.subcategory_id
)
WHERE d.restaurant_id IS NULL;

-- Step 3: Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_id ON public.dishes(restaurant_id);

-- Step 4: Create a trigger to auto-populate restaurant_id on insert/update
CREATE OR REPLACE FUNCTION public.set_dish_restaurant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get restaurant_id from subcategory chain
  SELECT c.restaurant_id INTO NEW.restaurant_id
  FROM subcategories s
  JOIN categories c ON c.id = s.category_id
  WHERE s.id = NEW.subcategory_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS set_dish_restaurant_id_trigger ON public.dishes;

CREATE TRIGGER set_dish_restaurant_id_trigger
BEFORE INSERT OR UPDATE OF subcategory_id ON public.dishes
FOR EACH ROW
EXECUTE FUNCTION public.set_dish_restaurant_id();

-- Step 5: Drop old complex RLS policies and create simpler ones
DROP POLICY IF EXISTS "Owners can manage dishes" ON public.dishes;
DROP POLICY IF EXISTS "Owners can view dishes of their restaurants" ON public.dishes;
DROP POLICY IF EXISTS "Public can view dishes of published restaurants" ON public.dishes;

-- New simplified RLS policy for owners (direct lookup, no JOINs)
CREATE POLICY "Owners can manage dishes" 
ON public.dishes 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.id = dishes.restaurant_id 
    AND restaurants.owner_id = auth.uid()
  )
);

-- New simplified RLS policy for public view
CREATE POLICY "Public can view dishes of published restaurants" 
ON public.dishes 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM restaurants 
    WHERE restaurants.id = dishes.restaurant_id 
    AND restaurants.published = true
  )
);