import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("subcategory_id", subcategoryId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Dish[];
    },
    enabled: !!subcategoryId,
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
        console.error("Error creating dish:", error);
        if (error.code === "42501") {
          throw new Error("Permission denied. Please make sure you're logged in and have access to this restaurant.");
        }
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dishes", data.subcategory_id] });
      queryClient.invalidateQueries({ queryKey: ["dishes", "restaurant"] });
      toast.success("Dish created");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create dish");
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dishes", data.subcategory_id] });
      queryClient.invalidateQueries({ queryKey: ["dishes", "restaurant"] });
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
    onSuccess: (subcategoryId) => {
      queryClient.invalidateQueries({ queryKey: ["dishes", subcategoryId] });
      queryClient.invalidateQueries({ queryKey: ["dishes", "restaurant"] });
      toast.success("Dish deleted");
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
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousDishes) {
        queryClient.setQueryData(["dishes", context.subcategoryId], context.previousDishes);
      }
      toast.error("Failed to reorder dishes");
    },
    onSettled: (_, __, variables) => {
      // Invalidate after completion
      queryClient.invalidateQueries({ queryKey: ["dishes", variables.subcategoryId] });
      queryClient.invalidateQueries({ queryKey: ["dishes", "restaurant"] });
    },
  });
};
