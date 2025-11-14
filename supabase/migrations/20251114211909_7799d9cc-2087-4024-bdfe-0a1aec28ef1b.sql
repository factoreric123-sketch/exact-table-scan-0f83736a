-- Add new customization settings to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS show_prices boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_images boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS layout_density text DEFAULT 'compact' CHECK (layout_density IN ('compact', 'spacious')),
ADD COLUMN IF NOT EXISTS grid_columns integer DEFAULT 2 CHECK (grid_columns IN (1, 2, 3)),
ADD COLUMN IF NOT EXISTS menu_font_size text DEFAULT 'medium' CHECK (menu_font_size IN ('small', 'medium', 'large')),
ADD COLUMN IF NOT EXISTS image_size text DEFAULT 'compact' CHECK (image_size IN ('compact', 'large')),
ADD COLUMN IF NOT EXISTS badge_colors jsonb DEFAULT '{"new_addition": "34, 197, 94", "special": "249, 115, 22", "popular": "6, 182, 212", "chef_recommendation": "59, 130, 246"}'::jsonb;

COMMENT ON COLUMN public.restaurants.show_prices IS 'Toggle price visibility on public menu';
COMMENT ON COLUMN public.restaurants.show_images IS 'Toggle image visibility on public menu (text-only mode)';
COMMENT ON COLUMN public.restaurants.layout_density IS 'Spacing density: compact or spacious';
COMMENT ON COLUMN public.restaurants.grid_columns IS 'Number of columns in grid layout (1, 2, or 3)';
COMMENT ON COLUMN public.restaurants.menu_font_size IS 'Font size for menu text: small, medium, or large';
COMMENT ON COLUMN public.restaurants.image_size IS 'Dish image size: compact or large';
COMMENT ON COLUMN public.restaurants.badge_colors IS 'Custom RGB colors for badge icons (new_addition, special, popular, chef_recommendation)';