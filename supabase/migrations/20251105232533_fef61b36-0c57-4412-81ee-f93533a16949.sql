-- Production performance indexes for scalability
-- These indexes optimize the most common query patterns for 100k+ concurrent users

-- Restaurants: Optimize slug lookups (primary access pattern for public menus)
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);

-- Restaurants: Optimize published status checks (filtering unpublished menus)
CREATE INDEX IF NOT EXISTS idx_restaurants_published ON public.restaurants(published) WHERE published = true;

-- Categories: Composite index for restaurant filtering and ordering
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_order ON public.categories(restaurant_id, order_index);

-- Subcategories: Composite index for category filtering and ordering
CREATE INDEX IF NOT EXISTS idx_subcategories_category_order ON public.subcategories(category_id, order_index);

-- Dishes: Composite index for subcategory filtering and ordering
CREATE INDEX IF NOT EXISTS idx_dishes_subcategory_order ON public.dishes(subcategory_id, order_index);

-- Dish Options: Index for dish lookup
CREATE INDEX IF NOT EXISTS idx_dish_options_dish_id ON public.dish_options(dish_id, order_index);

-- Dish Modifiers: Index for dish lookup
CREATE INDEX IF NOT EXISTS idx_dish_modifiers_dish_id ON public.dish_modifiers(dish_id, order_index);