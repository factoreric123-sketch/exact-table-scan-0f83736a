import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateTempId } from "@/lib/utils/uuid";
import { getErrorMessage } from "@/lib/errorUtils";

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export const useCategories = (restaurantId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["categories", restaurantId],
    queryFn: async () => {
      try {
        console.log('[useCategories] Fetching categories for restaurant:', restaurantId);
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .order("order_index", { ascending: true });

        if (error) {
          console.error('[useCategories] Query error:', error);
          // Don't throw for public menus - return empty array
          return [];
        }
        console.log('[useCategories] Categories fetched:', data?.length || 0);
        return (data as Category[]) || [];
      } catch (err) {
        console.error('[useCategories] Exception:', err);
        // Never throw - return empty array
        return [];
      }
    },
    enabled: !!restaurantId && (options?.enabled ?? true),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    placeholderData: (prev) => prev, // Keep previous data during refetch
    // CRITICAL: Never throw for public menus
    retry: 3,
    throwOnError: false,
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
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
    onError: (error, variables, context) => {
      if (context?.previous && context.restaurantId) {
        queryClient.setQueryData(["categories", context.restaurantId], context.previous);
      }
      const message = getErrorMessage(error);
      toast.error(`Failed to create category: ${message}`);
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
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories", context.restaurantId], context.previousCategories);
      }
      const message = getErrorMessage(error);
      toast.error(`Failed to reorder categories: ${message}`);
    },
    onSettled: (_, __, variables) => {
      // Invalidate after completion
      queryClient.invalidateQueries({ queryKey: ["categories", variables.restaurantId] });
    },
  });
};
