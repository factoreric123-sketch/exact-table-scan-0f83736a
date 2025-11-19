import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DishOption } from "./useDishOptions";
import type { DishModifier } from "./useDishModifiers";

// Client-side price normalization for instant feedback
export const normalizePrice = (price: string): string => {
  let normalized = price.replace(/[^0-9.]/g, "");
  if (normalized && !normalized.includes(".")) {
    normalized += ".00";
  } else if (normalized.split(".")[1]?.length === 1) {
    normalized += "0";
  }
  return normalized || "0.00";
};

// Helper to get restaurant ID from dish ID for cache invalidation
const getRestaurantIdFromDish = async (dishId: string): Promise<string | null> => {
  const { data: dish } = await supabase
    .from("dishes")
    .select(`
      subcategory_id,
      subcategories!inner(
        category_id,
        categories!inner(restaurant_id)
      )
    `)
    .eq("id", dishId)
    .single();

  return dish?.subcategories?.categories?.restaurant_id || null;
};

// Single cache invalidation function - called ONCE after all mutations
export const invalidateAllCaches = async (dishId: string, queryClient: any) => {
  const restaurantId = await getRestaurantIdFromDish(dishId);
  
  if (restaurantId) {
    // Batch all invalidations together
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dish-options", dishId] }),
      queryClient.invalidateQueries({ queryKey: ["dish-modifiers", dishId] }),
      queryClient.invalidateQueries({ queryKey: ["dishes"] }),
      queryClient.invalidateQueries({ queryKey: ["full-menu", restaurantId] }),
    ]);
    
    // Clear localStorage cache
    localStorage.removeItem(`fullMenu:${restaurantId}`);
  }
};

// ============= SILENT MUTATIONS (No toasts, no individual cache invalidation) =============

export const useCreateDishOptionSilent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (option: Omit<DishOption, "id" | "created_at">) => {
      const normalizedPrice = normalizePrice(option.price);
      
      const { data, error } = await supabase
        .from("dish_options")
        .insert({ ...option, price: normalizedPrice })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (option) => {
      await queryClient.cancelQueries({ queryKey: ["dish-options", option.dish_id] });
      const previous = queryClient.getQueryData<DishOption[]>(["dish-options", option.dish_id]);
      return { previous, dishId: option.dish_id };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.dishId) {
        queryClient.setQueryData(["dish-options", context.dishId], context.previous);
      }
    },
  });
};

export const useUpdateDishOptionSilent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DishOption> }) => {
      const payload: Partial<DishOption> = { ...updates };
      if (typeof updates.price === "string") {
        payload.price = normalizePrice(updates.price);
      }

      const { data, error } = await supabase
        .from("dish_options")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
};

export const useDeleteDishOptionSilent = () => {
  return useMutation({
    mutationFn: async ({ id }: { id: string; dishId: string }) => {
      const { error } = await supabase
        .from("dish_options")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
  });
};

export const useCreateDishModifierSilent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modifier: Omit<DishModifier, "id" | "created_at">) => {
      const normalizedPrice = normalizePrice(modifier.price);
      
      const { data, error } = await supabase
        .from("dish_modifiers")
        .insert({ ...modifier, price: normalizedPrice })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (modifier) => {
      await queryClient.cancelQueries({ queryKey: ["dish-modifiers", modifier.dish_id] });
      const previous = queryClient.getQueryData<DishModifier[]>(["dish-modifiers", modifier.dish_id]);
      return { previous, dishId: modifier.dish_id };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.dishId) {
        queryClient.setQueryData(["dish-modifiers", context.dishId], context.previous);
      }
    },
  });
};

export const useUpdateDishModifierSilent = () => {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DishModifier> }) => {
      const payload: Partial<DishModifier> = { ...updates };
      if (typeof updates.price === "string") {
        payload.price = normalizePrice(updates.price);
      }

      const { data, error } = await supabase
        .from("dish_modifiers")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
};

export const useDeleteDishModifierSilent = () => {
  return useMutation({
    mutationFn: async ({ id }: { id: string; dishId: string }) => {
      const { error } = await supabase
        .from("dish_modifiers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
  });
};
