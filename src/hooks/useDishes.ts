import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateUUID } from "@/lib/utils/uuid";
import { getErrorMessage } from "@/lib/errorUtils";
import { clearAllMenuCaches, invalidateMenuQueries } from "@/lib/cacheUtils";
import { menuSyncEmitter } from "@/lib/menuSyncEmitter";
import { syncStateManager } from "@/lib/syncStateManager";

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
 * Uses ONLY menuSyncEmitter to avoid duplicate updates
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

  // INSTANT: Emit to all listeners - they handle cache updates
  menuSyncEmitter.emitAll(updater);
};

/**
 * INSTANT sync helper - adds dish to full-menu cache
 * Uses ONLY menuSyncEmitter to avoid duplicate updates
 */
const addDishToFullMenuCache = (queryClient: any, subcategoryId: string, newDish: Dish) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    // Check if dish already exists to prevent duplicates
    let dishExists = false;
    data.categories.forEach((category: any) => {
      category.subcategories?.forEach((subcategory: any) => {
        if (subcategory.dishes?.some((dish: any) => dish.id === newDish.id)) {
          dishExists = true;
        }
      });
    });
    
    if (dishExists) {
      console.log('[addDishToFullMenuCache] Dish already exists, skipping:', newDish.id);
      return null; // Return null to indicate no update needed
    }
    
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

  // INSTANT emit - listeners handle cache updates
  menuSyncEmitter.emitAll(updater);
};

// Removed: replaceTempDishInFullMenuCache - no longer needed with real UUIDs

/**
 * INSTANT sync helper - removes dish from full-menu cache
 * Uses ONLY menuSyncEmitter to avoid duplicate updates
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

  // INSTANT emit - listeners handle cache updates
  menuSyncEmitter.emitAll(updater);
};

/**
 * INSTANT sync helper - reorders dishes in full-menu cache
 * Uses ONLY menuSyncEmitter to avoid duplicate updates
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

  // INSTANT emit - listeners handle cache updates
  menuSyncEmitter.emitAll(updater);
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
 * Phase 3: Use REAL UUIDs instead of temp IDs for instant sync
 * The same ID is used for optimistic update AND database insert
 */
export const useCreateDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dish: Partial<Dish> & { id?: string; subcategory_id: string }) => {
      // ID should already be set by onMutate, but generate if somehow missing
      const dishWithId = {
        ...dish,
        id: dish.id || generateUUID(),
      };

      const { data, error } = await supabase
        .from("dishes")
        .insert([dishWithId as any])
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
      // ALL operations here are SYNCHRONOUS - no await!
      if (!dish.subcategory_id) return;
      
      // 1. Get previous data (sync)
      const previous = queryClient.getQueryData<Dish[]>(["dishes", dish.subcategory_id]);
      
      // 2. Generate REAL UUID (same ID goes to DB) - NO MORE TEMP IDs!
      const realId = dish.id || generateUUID();
      
      // 3. MARK DISH AS SYNCING - shows loading state in preview/live
      syncStateManager.startDishSync(realId);
      
      const newDish: Dish = {
        id: realId,
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
      
      // Mutate the dish object to include the real ID for the mutationFn
      dish.id = realId;
      
      // 4. Cancel queries (sync - fire and forget)
      queryClient.cancelQueries({ queryKey: ["dishes", dish.subcategory_id] });
      
      // 5. Update dishes cache INSTANTLY (sync)
      if (previous) {
        queryClient.setQueryData<Dish[]>(["dishes", dish.subcategory_id], [...previous, newDish]);
      }
      
      // 6. Emit to full-menu cache INSTANTLY (sync) - SAME ID as DB!
      addDishToFullMenuCache(queryClient, dish.subcategory_id, newDish);
      
      // 7. BACKGROUND: Clear localStorage (non-blocking)
      getRestaurantIdFromSubcategory(dish.subcategory_id).then(restaurantId => {
        if (restaurantId) clearAllMenuCaches(restaurantId);
      });
      
      return { previous, subcategoryId: dish.subcategory_id, dishId: realId };
    },
    onSuccess: (data) => {
      // END SYNC - dish is now confirmed in database
      syncStateManager.endDishSync(data.id);
      
      // Clear localStorage so next load gets fresh data
      getRestaurantIdFromSubcategory(data.subcategory_id).then(restaurantId => {
        if (restaurantId) {
          clearAllMenuCaches(restaurantId);
        }
      });
      
      toast.success("Dish created");
    },
    onError: (error: Error, variables, context) => {
      // END SYNC on error too
      if (context?.dishId) {
        syncStateManager.endDishSync(context.dishId);
        removeDishFromFullMenuCache(queryClient, context.dishId);
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
