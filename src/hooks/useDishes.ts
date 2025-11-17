import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateTempId } from "@/lib/utils/uuid";
import { getErrorMessage } from "@/lib/errorUtils";

// Helper to get restaurant ID from subcategory ID
const getRestaurantIdFromSubcategory = async (subcategoryId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from("subcategories")
    .select("category_id, categories!inner(restaurant_id)")
    .eq("id", subcategoryId)
    .single();
  
  if (error || !data) return null;
  return (data.categories as any)?.restaurant_id || null;
};

// Helper to invalidate full menu cache
const invalidateFullMenuCache = async (queryClient: any, subcategoryId: string) => {
  const restaurantId = await getRestaurantIdFromSubcategory(subcategoryId);
  if (restaurantId) {
    // Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: ["full-menu", restaurantId] });
    // Clear localStorage cache
    localStorage.removeItem(`fullMenu:${restaurantId}`);
  }
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    placeholderData: (prev) => prev, // Keep previous data during refetch
    refetchOnMount: false, // Don't refetch unnecessarily
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
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });
};

export const useCreateDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dish: Partial<Dish>) => {
      // Ensure subcategory_id is set
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
    onMutate: async (dish) => {
      // Optimistic create
      if (!dish.subcategory_id) return;
      
      await queryClient.cancelQueries({ queryKey: ["dishes", dish.subcategory_id] });
      const previous = queryClient.getQueryData<Dish[]>(["dishes", dish.subcategory_id]);
      
      if (previous) {
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
          order_index: dish.order_index ?? previous.length,
          created_at: new Date().toISOString(),
          allergens: dish.allergens || null,
          calories: dish.calories || null,
          is_vegetarian: dish.is_vegetarian || false,
          is_vegan: dish.is_vegan || false,
          is_spicy: dish.is_spicy || false,
          has_options: dish.has_options || false,
        };
        queryClient.setQueryData<Dish[]>(["dishes", dish.subcategory_id], [...previous, tempDish]);
      }
      
      return { previous, subcategoryId: dish.subcategory_id };
    },
    onSuccess: async (data) => {
      // Invalidate full menu cache for live menu sync
      await invalidateFullMenuCache(queryClient, data.subcategory_id);
      
      // Invalidate editor caches
      queryClient.invalidateQueries({ queryKey: ["dishes", data.subcategory_id] });
      queryClient.invalidateQueries({ queryKey: ["dishes", "restaurant"] });
      queryClient.invalidateQueries({ queryKey: ["all-dishes-for-category"] });
      toast.success("Dish created");
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous && context.subcategoryId) {
        queryClient.setQueryData(["dishes", context.subcategoryId], context.previous);
      }
      const message = getErrorMessage(error);
      toast.error(`Failed to create dish: ${message}`);
    },
  });
};

export const useUpdateDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Dish> }) => {
      const { data, error } = await supabase
        .from("dishes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    retry: 3,
    retryDelay: (attempt) => Math.min(200 * Math.pow(2, attempt), 2000),
    onMutate: async ({ id, updates }) => {
      // Optimistic update
      const dish = queryClient.getQueriesData<Dish[]>({ queryKey: ["dishes"] })
        .flatMap(([, data]) => data || [])
        .find((d) => d.id === id);
      
      if (dish) {
        await queryClient.cancelQueries({ queryKey: ["dishes", dish.subcategory_id] });
        const previous = queryClient.getQueryData<Dish[]>(["dishes", dish.subcategory_id]);
        
        if (previous) {
          queryClient.setQueryData<Dish[]>(
            ["dishes", dish.subcategory_id],
            previous.map((d) => (d.id === id ? { ...d, ...updates } : d))
          );
        }
        
        return { previous, subcategoryId: dish.subcategory_id };
      }
    },
    onSuccess: async (data) => {
      // Invalidate full menu cache for live menu sync
      await invalidateFullMenuCache(queryClient, data.subcategory_id);
      
      // Invalidate editor caches
      queryClient.invalidateQueries({ queryKey: ["dishes", data.subcategory_id] });
      queryClient.invalidateQueries({ queryKey: ["dishes", "restaurant"] });
      queryClient.invalidateQueries({ queryKey: ["all-dishes-for-category"] });
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.subcategoryId) {
        queryClient.setQueryData(["dishes", context.subcategoryId], context.previous);
      }
    },
  });
};

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
    onMutate: async ({ id, subcategoryId }) => {
      // Optimistic delete
      await queryClient.cancelQueries({ queryKey: ["dishes", subcategoryId] });
      const previous = queryClient.getQueryData<Dish[]>(["dishes", subcategoryId]);
      
      if (previous) {
        queryClient.setQueryData<Dish[]>(
          ["dishes", subcategoryId],
          previous.filter((d) => d.id !== id)
        );
      }
      
      return { previous, subcategoryId };
    },
    onSuccess: async (subcategoryId) => {
      // Invalidate full menu cache for live menu sync
      await invalidateFullMenuCache(queryClient, subcategoryId);
      
      // Invalidate editor caches
      queryClient.invalidateQueries({ queryKey: ["dishes", subcategoryId] });
      queryClient.invalidateQueries({ queryKey: ["dishes", "restaurant"] });
      queryClient.invalidateQueries({ queryKey: ["all-dishes-for-category"] });
      toast.success("Dish deleted");
    },
    onError: (error, _variables, context) => {
      if (context?.previous && context.subcategoryId) {
        queryClient.setQueryData(["dishes", context.subcategoryId], context.previous);
      }
      const message = getErrorMessage(error);
      toast.error(`Failed to delete dish: ${message}`);
    },
  });
};

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
      // Use optimized batch update function
      const { error } = await supabase.rpc('batch_update_order_indexes_optimized', {
        table_name: 'dishes',
        updates: dishes
      });

      if (error) throw error;
    },
    onMutate: async ({ dishes, subcategoryId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["dishes", subcategoryId] });

      // Snapshot previous value
      const previousDishes = queryClient.getQueryData(["dishes", subcategoryId]);

      // Optimistically update cache
      if (previousDishes) {
        const optimisticData = (previousDishes as any[]).map(dish => {
          const update = dishes.find(u => u.id === dish.id);
          return update ? { ...dish, order_index: update.order_index } : dish;
        }).sort((a, b) => a.order_index - b.order_index);
        
        queryClient.setQueryData(["dishes", subcategoryId], optimisticData);
      }

      return { previousDishes, subcategoryId };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousDishes) {
        queryClient.setQueryData(["dishes", context.subcategoryId], context.previousDishes);
      }
      const message = getErrorMessage(error);
      toast.error(`Failed to reorder dishes: ${message}`);
    },
    onSettled: async (_, __, variables) => {
      // Invalidate full menu cache for live menu sync
      await invalidateFullMenuCache(queryClient, variables.subcategoryId);
      
      // Invalidate editor caches after completion
      queryClient.invalidateQueries({ queryKey: ["dishes", variables.subcategoryId] });
      queryClient.invalidateQueries({ queryKey: ["dishes", "restaurant"] });
      queryClient.invalidateQueries({ queryKey: ["all-dishes-for-category"] });
    },
  });
};
