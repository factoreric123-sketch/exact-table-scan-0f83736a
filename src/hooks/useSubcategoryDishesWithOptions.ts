import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dish } from "@/hooks/useDishes";

interface DishOption {
  id: string;
  dish_id: string;
  name: string;
  price: string;
  order_index: number;
}

interface DishModifier {
  id: string;
  dish_id: string;
  name: string;
  price: string;
  order_index: number;
}

export interface DishWithOptions extends Dish {
  options: DishOption[];
  modifiers: DishModifier[];
}

/**
 * Efficiently fetches options and modifiers for all dishes in a subcategory
 * Uses only 2 queries regardless of number of dishes
 */
export const useSubcategoryDishesWithOptions = (dishes: Dish[], enabled: boolean = true) => {
  return useQuery({
    queryKey: ["subcategory-dishes-with-options", dishes.map(d => d.id).sort().join(",")],
    queryFn: async (): Promise<DishWithOptions[]> => {
      if (!dishes.length) return [];

      const dishIds = dishes.map(d => d.id);

      // Fetch all options for these dishes in a single query
      const { data: optionsData } = await supabase
        .from("dish_options")
        .select("*")
        .in("dish_id", dishIds)
        .order("order_index", { ascending: true });

      // Fetch all modifiers for these dishes in a single query
      const { data: modifiersData } = await supabase
        .from("dish_modifiers")
        .select("*")
        .in("dish_id", dishIds)
        .order("order_index", { ascending: true });

      // Build lookup maps
      const optionsByDish = new Map<string, DishOption[]>();
      const modifiersByDish = new Map<string, DishModifier[]>();

      optionsData?.forEach((option) => {
        if (!optionsByDish.has(option.dish_id)) {
          optionsByDish.set(option.dish_id, []);
        }
        optionsByDish.get(option.dish_id)!.push(option);
      });

      modifiersData?.forEach((modifier) => {
        if (!modifiersByDish.has(modifier.dish_id)) {
          modifiersByDish.set(modifier.dish_id, []);
        }
        modifiersByDish.get(modifier.dish_id)!.push(modifier);
      });

      // Attach options and modifiers to each dish
      return dishes.map((dish) => ({
        ...dish,
        options: optionsByDish.get(dish.id) || [],
        modifiers: modifiersByDish.get(dish.id) || [],
      }));
    },
    enabled: enabled && dishes.length > 0,
    staleTime: 30000, // 30 seconds
  });
};
