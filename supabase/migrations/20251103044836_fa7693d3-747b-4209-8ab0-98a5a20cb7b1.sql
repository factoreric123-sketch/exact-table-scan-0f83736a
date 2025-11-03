-- Add performance indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_dishes_subcategory_order ON dishes(subcategory_id, order_index);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_order ON subcategories(category_id, order_index);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_order ON categories(restaurant_id, order_index);
CREATE INDEX IF NOT EXISTS idx_dish_options_dish_order ON dish_options(dish_id, order_index);
CREATE INDEX IF NOT EXISTS idx_dish_modifiers_dish_order ON dish_modifiers(dish_id, order_index);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_published ON restaurants(owner_id, published);

-- Add index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);

-- Analyze tables for query optimization
ANALYZE dishes;
ANALYZE subcategories;
ANALYZE categories;
ANALYZE restaurants;
ANALYZE dish_options;
ANALYZE dish_modifiers;
ANALYZE subscriptions;