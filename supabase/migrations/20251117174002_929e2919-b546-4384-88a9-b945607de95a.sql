-- Update get_restaurant_full_menu to include ALL dish fields including dietary info
CREATE OR REPLACE FUNCTION public.get_restaurant_full_menu(p_restaurant_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
BEGIN
  WITH restaurant_data AS (
    SELECT row_to_json(r) as restaurant
    FROM restaurants r 
    WHERE r.id = p_restaurant_id
  ),
  categories_data AS (
    SELECT json_agg(
      json_build_object(
        'id', c.id,
        'name', c.name,
        'restaurant_id', c.restaurant_id,
        'order_index', c.order_index,
        'created_at', c.created_at,
        'subcategories', (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', s.id,
              'name', s.name,
              'category_id', s.category_id,
              'order_index', s.order_index,
              'created_at', s.created_at,
              'dishes', (
                SELECT COALESCE(json_agg(
                  json_build_object(
                    'id', d.id,
                    'name', d.name,
                    'description', d.description,
                    'price', d.price,
                    'image_url', d.image_url,
                    'is_new', d.is_new,
                    'is_special', d.is_special,
                    'is_popular', d.is_popular,
                    'is_chef_recommendation', d.is_chef_recommendation,
                    'allergens', d.allergens,
                    'calories', d.calories,
                    'is_vegetarian', d.is_vegetarian,
                    'is_vegan', d.is_vegan,
                    'is_spicy', d.is_spicy,
                    'order_index', d.order_index,
                    'subcategory_id', d.subcategory_id,
                    'has_options', d.has_options,
                    'created_at', d.created_at
                  ) ORDER BY d.order_index
                ), '[]'::json)
                FROM dishes d
                WHERE d.subcategory_id = s.id
              )
            ) ORDER BY s.order_index
          ), '[]'::json)
          FROM subcategories s
          WHERE s.category_id = c.id
        )
      ) ORDER BY c.order_index
    ) as categories
    FROM categories c
    WHERE c.restaurant_id = p_restaurant_id
  )
  SELECT json_build_object(
    'restaurant', (SELECT restaurant FROM restaurant_data),
    'categories', COALESCE((SELECT categories FROM categories_data), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$function$;