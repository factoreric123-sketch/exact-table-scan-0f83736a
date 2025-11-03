-- Create dish_options table for size/type variants
CREATE TABLE public.dish_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dish_options_dish_id ON public.dish_options(dish_id);

-- Enable RLS
ALTER TABLE public.dish_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dish_options
CREATE POLICY "Owners can manage dish options"
ON public.dish_options FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dishes d
    JOIN public.subcategories s ON s.id = d.subcategory_id
    JOIN public.categories c ON c.id = s.category_id
    JOIN public.restaurants r ON r.id = c.restaurant_id
    WHERE d.id = dish_options.dish_id 
    AND r.owner_id = auth.uid()
  )
);

CREATE POLICY "Public can view dish options"
ON public.dish_options FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dishes d
    JOIN public.subcategories s ON s.id = d.subcategory_id
    JOIN public.categories c ON c.id = s.category_id
    JOIN public.restaurants r ON r.id = c.restaurant_id
    WHERE d.id = dish_options.dish_id 
    AND r.published = true
  )
);

-- Create dish_modifiers table for add-ons/extras
CREATE TABLE public.dish_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dish_modifiers_dish_id ON public.dish_modifiers(dish_id);

-- Enable RLS
ALTER TABLE public.dish_modifiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dish_modifiers
CREATE POLICY "Owners can manage dish modifiers"
ON public.dish_modifiers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dishes d
    JOIN public.subcategories s ON s.id = d.subcategory_id
    JOIN public.categories c ON c.id = s.category_id
    JOIN public.restaurants r ON r.id = c.restaurant_id
    WHERE d.id = dish_modifiers.dish_id 
    AND r.owner_id = auth.uid()
  )
);

CREATE POLICY "Public can view dish modifiers"
ON public.dish_modifiers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dishes d
    JOIN public.subcategories s ON s.id = d.subcategory_id
    JOIN public.categories c ON c.id = s.category_id
    JOIN public.restaurants r ON r.id = c.restaurant_id
    WHERE d.id = dish_modifiers.dish_id 
    AND r.published = true
  )
);

-- Add has_options column to dishes table
ALTER TABLE public.dishes 
ADD COLUMN has_options BOOLEAN DEFAULT false;