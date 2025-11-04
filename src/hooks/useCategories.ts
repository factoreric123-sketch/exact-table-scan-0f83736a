import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateTempId } from "@/lib/utils/uuid";

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export const useCategories = (restaurantId: string) => {
  return useQuery({
    queryKey: ["categories", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    placeholderData: (prev) => prev, // Keep previous data during refetch
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Partial<Category>) => {
      const { data, error } = await supabase
        .from("categories")
        .insert([category as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (category) => {
      // Optimistic create
      if (!category.restaurant_id) return;
      
      await queryClient.cancelQueries({ queryKey: ["categories", category.restaurant_id] });
      const previous = queryClient.getQueryData<Category[]>(["categories", category.restaurant_id]);
      
      if (previous) {
        const tempCategory: Category = {
          id: generateTempId(),
          restaurant_id: category.restaurant_id,
          name: category.name || "New Category",
          order_index: category.order_index ?? previous.length,
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<Category[]>(["categories", category.restaurant_id], [...previous, tempCategory]);
      }
      
      return { previous, restaurantId: category.restaurant_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories", data.restaurant_id] });
    },
    onError: (error, variables, context) => {
      console.error("Failed to create category:", error);
      if (context?.previous && context.restaurantId) {
        queryClient.setQueryData(["categories", context.restaurantId], context.previous);
      }
      const errorMessage = error instanceof Error ? error.message : "Failed to create category";
      toast.error(errorMessage);
    },
    onSettled: (_, __, variables) => {
      if (variables.restaurant_id) {
        queryClient.invalidateQueries({ queryKey: ["categories", variables.restaurant_id] });
      }
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories", data.restaurant_id] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return restaurantId;
    },
    onSuccess: (restaurantId) => {
      queryClient.invalidateQueries({ queryKey: ["categories", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Category deleted");
    },
  });
};

export const useUpdateCategoriesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      categories, 
      restaurantId 
    }: { 
      categories: { id: string; order_index: number }[];
      restaurantId: string;
    }) => {
      // Use optimized batch update function
      const { error } = await supabase.rpc('batch_update_order_indexes_optimized', {
        table_name: 'categories',
        updates: categories
      });

      if (error) throw error;
    },
    onMutate: async ({ categories, restaurantId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["categories", restaurantId] });

      // Snapshot previous value
      const previousCategories = queryClient.getQueryData(["categories", restaurantId]);

      // Optimistically update cache
      if (previousCategories) {
        const optimisticData = (previousCategories as any[]).map(cat => {
          const update = categories.find(u => u.id === cat.id);
          return update ? { ...cat, order_index: update.order_index } : cat;
        }).sort((a, b) => a.order_index - b.order_index);
        
        queryClient.setQueryData(["categories", restaurantId], optimisticData);
      }

      return { previousCategories, restaurantId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories", context.restaurantId], context.previousCategories);
      }
      toast.error("Failed to reorder categories");
    },
    onSettled: (_, __, variables) => {
      // Invalidate after completion
      queryClient.invalidateQueries({ queryKey: ["categories", variables.restaurantId] });
    },
  });
};
