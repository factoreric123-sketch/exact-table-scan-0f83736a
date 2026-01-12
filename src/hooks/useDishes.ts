import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateTempId } from "@/lib/utils/uuid";
import { getErrorMessage } from "@/lib/errorUtils";
import { clearAllMenuCaches, invalidateMenuQueries } from "@/lib/cacheUtils";
import { menuSyncEmitter } from "@/lib/menuSyncEmitter";

// Helper to get restaurant ID from subcategory ID (background operation)
const getRestaurantIdFromSubcategory = async (subcategoryId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from("subcategories")
    .select("category_id, categories!inner(restaurant_id)")
    .eq("id", subcategoryId)
    .single();
  
  if (error || !data) return null;
  return (data.categories as any)?.restaurant_id || null;
};

/**
 * INSTANT sync helper - updates dish in full-menu cache
 * Phase 2: No blocking operations before emit
 */
const updateDishInFullMenuCache = (queryClient: any, dishId: string, updates: Partial<Dish>) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    return {
      ...data,
      categories: data.categories.map((category: any) => ({
        ...category,
        subcategories: category.subcategories?.map((subcategory: any) => ({
          ...subcategory,
          dishes: subcategory.dishes?.map((dish: any) => 
            dish.id === dishId ? { ...dish, ...updates } : dish
          )
        }))
      }))
    };
  };

  // INSTANT: Emit to all listeners (no await)
  menuSyncEmitter.emitAll(updater);
  
  // Also update React Query cache synchronously
  const fullMenuQueries = queryClient.getQueriesData({ queryKey: ["full-menu"] });
  fullMenuQueries.forEach(([key, data]: [any, any]) => {
    if (data) {
      const updated = updater(data);
      if (updated) queryClient.setQueryData(key, updated);
    }
  });
};

/**
 * INSTANT sync helper - adds dish to full-menu cache
 */
const addDishToFullMenuCache = (queryClient: any, subcategoryId: string, newDish: Dish) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    return {
      ...data,
      categories: data.categories.map((category: any) => ({
        ...category,
        subcategories: category.subcategories?.map((subcategory: any) => {
          if (subcategory.id === subcategoryId) {
            return {
              ...subcategory,
              dishes: [...(subcategory.dishes || []), newDish]
            };
          }
          return subcategory;
        })
      }))
    };
  };

  // INSTANT emit
  menuSyncEmitter.emitAll(updater);
  
  // Also update React Query cache
  const fullMenuQueries = queryClient.getQueriesData({ queryKey: ["full-menu"] });
  fullMenuQueries.forEach(([key, data]: [any, any]) => {
    if (data) {
      const updated = updater(data);
      if (updated) queryClient.setQueryData(key, updated);
    }
  });
};

/**
 * INSTANT sync helper - replaces temp dish with real dish from DB
 */
const replaceTempDishInFullMenuCache = (queryClient: any, tempId: string, realDish: Dish) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    return {
      ...data,
      categories: data.categories.map((category: any) => ({
        ...category,
        subcategories: category.subcategories?.map((subcategory: any) => ({
          ...subcategory,
          dishes: subcategory.dishes?.map((dish: any) => 
            dish.id === tempId ? { ...realDish } : dish
          )
        }))
      }))
    };
  };

  // INSTANT emit to all listeners
  menuSyncEmitter.emitAll(updater);
  
  // Also update React Query cache
  const fullMenuQueries = queryClient.getQueriesData({ queryKey: ["full-menu"] });
  fullMenuQueries.forEach(([key, data]: [any, any]) => {
    if (data) {
      const updated = updater(data);
      if (updated) queryClient.setQueryData(key, updated);
    }
  });
};

/**
 * INSTANT sync helper - removes dish from full-menu cache
 */
const removeDishFromFullMenuCache = (queryClient: any, dishId: string) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    return {
      ...data,
      categories: data.categories.map((category: any) => ({
        ...category,
        subcategories: category.subcategories?.map((subcategory: any) => ({
          ...subcategory,
          dishes: subcategory.dishes?.filter((dish: any) => dish.id !== dishId)
        }))
      }))
    };
  };

  // INSTANT emit
  menuSyncEmitter.emitAll(updater);
  
  // Also update React Query cache
  const fullMenuQueries = queryClient.getQueriesData({ queryKey: ["full-menu"] });
  fullMenuQueries.forEach(([key, data]: [any, any]) => {
    if (data) {
      const updated = updater(data);
      if (updated) queryClient.setQueryData(key, updated);
    }
  });
};

/**
 * INSTANT sync helper - reorders dishes in full-menu cache
 */
const reorderDishesInFullMenuCache = (queryClient: any, subcategoryId: string, orderedDishes: { id: string; order_index: number }[]) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    return {
      ...data,
      categories: data.categories.map((category: any) => ({
        ...category,
        subcategories: category.subcategories?.map((subcategory: any) => {
          if (subcategory.id === subcategoryId) {
            const reorderedDishes = [...(subcategory.dishes || [])].map(dish => {
              const update = orderedDishes.find(u => u.id === dish.id);
              return update ? { ...dish, order_index: update.order_index } : dish;
            }).sort((a, b) => a.order_index - b.order_index);
            
            return { ...subcategory, dishes: reorderedDishes };
          }
          return subcategory;
        })
      }))
    };
  };

  // INSTANT emit
  menuSyncEmitter.emitAll(updater);
  
  // Also update React Query cache
  const fullMenuQueries = queryClient.getQueriesData({ queryKey: ["full-menu"] });
  fullMenuQueries.forEach(([key, data]: [any, any]) => {
    if (data) {
      const updated = updater(data);
      if (updated) queryClient.setQueryData(key, updated);
    }
  });
};

export interface Dish {
  id: string;
  subcategory_id: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_new: boolean;
  is_special: boolean;
  is_popular: boolean;
  is_chef_recommendation: boolean;
  order_index: number;
  created_at: string;
  allergens: string[] | null;
  calories: number | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  has_options: boolean;
}

export const useDishes = (subcategoryId: string) => {
  return useQuery({
    queryKey: ["dishes", subcategoryId],
    queryFn: async () => {
      if (!subcategoryId) return [];
      
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("subcategory_id", subcategoryId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Dish[];
    },
    enabled: !!subcategoryId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    placeholderData: (prev) => prev,
    refetchOnMount: false,
  });
};

export const useDishesByRestaurant = (restaurantId: string) => {
  return useQuery({
    queryKey: ["dishes", "restaurant", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dishes")
        .select(`
          *,
          subcategories!inner (
            category_id,
            categories!inner (
              restaurant_id
            )
          )
        `)
        .eq("subcategories.categories.restaurant_id", restaurantId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Dish[];
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
  });
};

/**
 * Phase 2: ZERO blocking operations before optimistic update
 */
export const useCreateDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dish: Partial<Dish>) => {
      if (!dish.subcategory_id) {
        throw new Error("Subcategory ID is required");
      }

      const { data, error } = await supabase
        .from("dishes")
        .insert([dish as any])
        .select()
        .single();

      if (error) {
        if (error.code === "42501") {
          throw new Error("Permission denied. Please make sure you're logged in and have access to this restaurant.");
        }
        throw error;
      }
      return data as Dish;
    },
    onMutate: (dish) => {
      // PHASE 2: ALL operations here are SYNCHRONOUS - no await!
      if (!dish.subcategory_id) return;
      
      // 1. Get previous data (sync)
      const previous = queryClient.getQueryData<Dish[]>(["dishes", dish.subcategory_id]);
      
      // 2. Create temp dish (sync)
      const tempDish: Dish = {
        id: generateTempId(),
        subcategory_id: dish.subcategory_id,
        name: dish.name || "New Dish",
        description: dish.description || null,
        price: dish.price || "0.00",
        image_url: dish.image_url || null,
        is_new: dish.is_new || false,
        is_special: dish.is_special || false,
        is_popular: dish.is_popular || false,
        is_chef_recommendation: dish.is_chef_recommendation || false,
        order_index: dish.order_index ?? (previous?.length || 0),
        created_at: new Date().toISOString(),
        allergens: dish.allergens || null,
        calories: dish.calories || null,
        is_vegetarian: dish.is_vegetarian || false,
        is_vegan: dish.is_vegan || false,
        is_spicy: dish.is_spicy || false,
        has_options: dish.has_options || false,
      };
      
      // 3. Cancel queries (sync - fire and forget)
      queryClient.cancelQueries({ queryKey: ["dishes", dish.subcategory_id] });
      
      // 4. Update dishes cache INSTANTLY (sync)
      if (previous) {
        queryClient.setQueryData<Dish[]>(["dishes", dish.subcategory_id], [...previous, tempDish]);
      }
      
      // 5. Emit to full-menu cache INSTANTLY (sync)
      addDishToFullMenuCache(queryClient, dish.subcategory_id, tempDish);
      
      // 6. BACKGROUND: Clear localStorage (non-blocking)
      getRestaurantIdFromSubcategory(dish.subcategory_id).then(restaurantId => {
        if (restaurantId) clearAllMenuCaches(restaurantId);
      });
      
      return { previous, subcategoryId: dish.subcategory_id, tempId: tempDish.id };
    },
    onSuccess: (data, _, context) => {
      // CRITICAL: Replace temp dish with real dish in ALL caches INSTANTLY
      if (context?.tempId) {
        // 1. Replace in full-menu cache (broadcasts to preview/live menu)
        replaceTempDishInFullMenuCache(queryClient, context.tempId, data as Dish);
        
        // 2. Replace in dishes cache (for editor)
        const currentDishes = queryClient.getQueryData<Dish[]>(["dishes", data.subcategory_id]);
        if (currentDishes) {
          queryClient.setQueryData<Dish[]>(
            ["dishes", data.subcategory_id],
            currentDishes.map(d => d.id === context.tempId ? (data as Dish) : d)
          );
        }
      }
      
      // Background: Clear localStorage so next load gets fresh data
      getRestaurantIdFromSubcategory(data.subcategory_id).then(restaurantId => {
        if (restaurantId) {
          clearAllMenuCaches(restaurantId);
        }
      });
      
      toast.success("Dish created");
    },
    onError: (error: Error, variables, context) => {
      // Remove temp dish from all caches on error
      if (context?.tempId) {
        removeDishFromFullMenuCache(queryClient, context.tempId);
      }
      if (context?.previous && context.subcategoryId) {
        queryClient.setQueryData(["dishes", context.subcategoryId], context.previous);
      }
      toast.error("Couldn't create dish. Please try again.");
    },
  });
};

/**
 * Phase 2: ZERO blocking operations before optimistic update
 */
export const useUpdateDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Dish> }) => {
      const payload: Partial<Dish> = { ...updates };
      if (typeof updates.price === "string") {
        let normalizedPrice = updates.price.replace(/[^0-9.]/g, "");
        if (normalizedPrice && !normalizedPrice.includes(".")) {
          normalizedPrice += ".00";
        } else if (normalizedPrice.split(".")[1]?.length === 1) {
          normalizedPrice += "0";
        }
        payload.price = normalizedPrice || "0.00";
      }

      const { data, error } = await supabase
        .from("dishes")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    retry: 3,
    retryDelay: (attempt) => Math.min(200 * Math.pow(2, attempt), 2000),
    onMutate: ({ id, updates }) => {
      // 1. Emit to full-menu INSTANTLY (sync) - FIRST!
      updateDishInFullMenuCache(queryClient, id, updates);
      
      // 2. Find dish and update dishes cache (sync)
      const dish = queryClient.getQueriesData<Dish[]>({ queryKey: ["dishes"] })
        .flatMap(([, data]) => data || [])
        .find((d) => d.id === id);
      
      if (dish) {
        queryClient.cancelQueries({ queryKey: ["dishes", dish.subcategory_id] });
        const previous = queryClient.getQueryData<Dish[]>(["dishes", dish.subcategory_id]);
        
        if (previous) {
          queryClient.setQueryData<Dish[]>(
            ["dishes", dish.subcategory_id],
            previous.map((d) => (d.id === id ? { ...d, ...updates } : d))
          );
        }
        
        // Background: clear localStorage
        getRestaurantIdFromSubcategory(dish.subcategory_id).then(restaurantId => {
          if (restaurantId) clearAllMenuCaches(restaurantId);
        });
        
        return { previous, subcategoryId: dish.subcategory_id };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["dishes", data.subcategory_id],
        refetchType: 'none'
      });
      queryClient.invalidateQueries({ 
        queryKey: ["dishes", "restaurant"],
        refetchType: 'none'
      });
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.subcategoryId) {
        queryClient.setQueryData(["dishes", context.subcategoryId], context.previous);
      }
    },
  });
};

/**
 * Phase 2: ZERO blocking operations before optimistic update
 */
export const useDeleteDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, subcategoryId }: { id: string; subcategoryId: string }) => {
      // Skip database delete for temporary IDs - they don't exist in DB yet
      if (id.startsWith('temp_')) {
        return subcategoryId;
      }
      
      const { error } = await supabase
        .from("dishes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return subcategoryId;
    },
    onMutate: ({ id, subcategoryId }) => {
      // 1. Remove from full-menu INSTANTLY (sync) - FIRST!
      removeDishFromFullMenuCache(queryClient, id);
      
      // 2. Cancel queries (sync)
      queryClient.cancelQueries({ queryKey: ["dishes", subcategoryId] });
      
      // 3. Update dishes cache (sync)
      const previous = queryClient.getQueryData<Dish[]>(["dishes", subcategoryId]);
      if (previous) {
        queryClient.setQueryData<Dish[]>(
          ["dishes", subcategoryId],
          previous.filter((d) => d.id !== id)
        );
      }
      
      // 4. Background: clear localStorage
      getRestaurantIdFromSubcategory(subcategoryId).then(restaurantId => {
        if (restaurantId) clearAllMenuCaches(restaurantId);
      });
      
      return { previous, subcategoryId };
    },
    onSuccess: (subcategoryId, _, context) => {
      getRestaurantIdFromSubcategory(subcategoryId).then(restaurantId => {
        if (restaurantId) {
          invalidateMenuQueries(queryClient, restaurantId);
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ["dishes", subcategoryId] });
      queryClient.invalidateQueries({ queryKey: ["dishes", "restaurant"] });
      toast.success("Dish deleted");
    },
    onError: (error, _variables, context) => {
      if (context?.previous && context.subcategoryId) {
        queryClient.setQueryData(["dishes", context.subcategoryId], context.previous);
      }
      // User-friendly error messages
      toast.error("Couldn't delete this dish. Please try again.");
    },
  });
};

/**
 * Phase 2: ZERO blocking operations before optimistic update
 */
export const useUpdateDishesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      dishes,
      subcategoryId
    }: { 
      dishes: { id: string; order_index: number }[];
      subcategoryId: string;
    }) => {
      const { error } = await supabase.rpc('batch_update_order_indexes_optimized', {
        table_name: 'dishes',
        updates: dishes
      });

      if (error) throw error;
    },
    onMutate: ({ dishes, subcategoryId }) => {
      // 1. Reorder in full-menu INSTANTLY (sync) - FIRST!
      reorderDishesInFullMenuCache(queryClient, subcategoryId, dishes);
      
      // 2. Cancel queries (sync)
      queryClient.cancelQueries({ queryKey: ["dishes", subcategoryId] });

      // 3. Update dishes cache (sync)
      const previousDishes = queryClient.getQueryData(["dishes", subcategoryId]);
      if (previousDishes) {
        const optimisticData = (previousDishes as any[]).map(dish => {
          const update = dishes.find(u => u.id === dish.id);
          return update ? { ...dish, order_index: update.order_index } : dish;
        }).sort((a, b) => a.order_index - b.order_index);
        
        queryClient.setQueryData(["dishes", subcategoryId], optimisticData);
      }

      // 4. Background: clear localStorage
      getRestaurantIdFromSubcategory(subcategoryId).then(restaurantId => {
        if (restaurantId) clearAllMenuCaches(restaurantId);
      });

      return { previousDishes, subcategoryId };
    },
    onError: (error, variables, context) => {
      if (context?.previousDishes) {
        queryClient.setQueryData(["dishes", context.subcategoryId], context.previousDishes);
      }
      const message = getErrorMessage(error);
      toast.error(`Failed to reorder dishes: ${message}`);
    },
    onSettled: (_, __, variables) => {
      getRestaurantIdFromSubcategory(variables.subcategoryId).then(restaurantId => {
        if (restaurantId) {
          invalidateMenuQueries(queryClient, restaurantId);
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ["dishes", variables.subcategoryId] });
      queryClient.invalidateQueries({ queryKey: ["dishes", "restaurant"] });
    },
  });
};
