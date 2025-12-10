import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";
import { broadcastMenuChange } from "@/hooks/useMenuSync";

// Helper to get restaurant ID from category ID
const getRestaurantIdFromCategory = async (categoryId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from("categories")
    .select("restaurant_id")
    .eq("id", categoryId)
    .single();
  
  if (error || !data) return null;
  return data.restaurant_id;
};

// Helper to invalidate and broadcast
const invalidateAndBroadcast = async (queryClient: any, categoryId: string) => {
  const restaurantId = await getRestaurantIdFromCategory(categoryId);
  if (restaurantId) {
    queryClient.invalidateQueries({ queryKey: ["full-menu", restaurantId] });
    localStorage.removeItem(`fullMenu:${restaurantId}`);
    broadcastMenuChange(restaurantId);
  }
};

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export const useSubcategories = (categoryId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      try {
        console.log('[useSubcategories] Fetching subcategories for category:', categoryId);
        const { data, error } = await supabase
          .from("subcategories")
          .select("*")
          .eq("category_id", categoryId)
          .order("order_index", { ascending: true });

        if (error) {
          console.error('[useSubcategories] Query error:', error);
          // Don't throw for public menus - return empty array
          return [];
        }
        console.log('[useSubcategories] Subcategories fetched:', data?.length || 0);
        return (data as Subcategory[]) || [];
      } catch (err) {
        console.error('[useSubcategories] Exception:', err);
        // Never throw - return empty array
        return [];
      }
    },
    enabled: !!categoryId && (options?.enabled ?? true),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    placeholderData: (prev) => prev, // Keep previous data during refetch
    // CRITICAL: Never throw for public menus
    retry: 3,
    throwOnError: false,
  });
};

export const useSubcategoriesByRestaurant = (restaurantId: string) => {
  return useQuery({
    queryKey: ["subcategories", "restaurant", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select(`
          *,
          categories!inner (
            restaurant_id
          )
        `)
        .eq("categories.restaurant_id", restaurantId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Subcategory[];
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });
};

export const useCreateSubcategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subcategory: Partial<Subcategory>) => {
      const { data, error } = await supabase
        .from("subcategories")
        .insert([subcategory as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (subcategory) => {
      if (!subcategory.category_id) return;
      
      await queryClient.cancelQueries({ queryKey: ["subcategories", subcategory.category_id] });
      const previous = queryClient.getQueryData<Subcategory[]>(["subcategories", subcategory.category_id]);
      
      if (previous) {
        const tempSub: Subcategory = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category_id: subcategory.category_id,
          name: subcategory.name || "New Subcategory",
          order_index: subcategory.order_index ?? previous.length,
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<Subcategory[]>(["subcategories", subcategory.category_id], [...previous, tempSub]);
      }
      
      return { previous, categoryId: subcategory.category_id };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["subcategories", data.category_id] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", "restaurant"] });
      await invalidateAndBroadcast(queryClient, data.category_id);
    },
    onError: (error, _variables, context) => {
      if (context?.previous && context.categoryId) {
        queryClient.setQueryData(["subcategories", context.categoryId], context.previous);
      }
      const message = getErrorMessage(error);
      toast.error(`Failed to create subcategory: ${message}`);
    },
    onSettled: (_, __, variables) => {
      if (variables.category_id) {
        queryClient.invalidateQueries({ queryKey: ["subcategories", variables.category_id] });
      }
    },
  });
};

export const useUpdateSubcategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Subcategory> }) => {
      const { data, error } = await supabase
        .from("subcategories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["subcategories", data.category_id] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", "restaurant"] });
      await invalidateAndBroadcast(queryClient, data.category_id);
    },
  });
};

export const useDeleteSubcategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, categoryId }: { id: string; categoryId: string }) => {
      const { error } = await supabase
        .from("subcategories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return categoryId;
    },
    onSuccess: async (categoryId) => {
      queryClient.invalidateQueries({ queryKey: ["subcategories", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", "restaurant"] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      await invalidateAndBroadcast(queryClient, categoryId);
      toast.success("Subcategory deleted");
    },
  });
};

export const useUpdateSubcategoriesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      subcategories,
      categoryId
    }: { 
      subcategories: { id: string; order_index: number }[];
      categoryId: string;
    }) => {
      // Use optimized batch update function
      const { error } = await supabase.rpc('batch_update_order_indexes_optimized', {
        table_name: 'subcategories',
        updates: subcategories
      });

      if (error) throw error;
    },
    onMutate: async ({ subcategories, categoryId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["subcategories", categoryId] });

      // Snapshot previous value
      const previousSubcategories = queryClient.getQueryData(["subcategories", categoryId]);

      // Optimistically update cache
      if (previousSubcategories) {
        const optimisticData = (previousSubcategories as any[]).map(sub => {
          const update = subcategories.find(u => u.id === sub.id);
          return update ? { ...sub, order_index: update.order_index } : sub;
        }).sort((a, b) => a.order_index - b.order_index);
        
        queryClient.setQueryData(["subcategories", categoryId], optimisticData);
      }

      return { previousSubcategories, categoryId };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousSubcategories) {
        queryClient.setQueryData(["subcategories", context.categoryId], context.previousSubcategories);
      }
      const message = getErrorMessage(error);
      toast.error(`Failed to reorder subcategories: ${message}`);
    },
    onSettled: (_, __, variables) => {
      // Invalidate after completion
      queryClient.invalidateQueries({ queryKey: ["subcategories", variables.categoryId] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", "restaurant"] });
    },
  });
};
