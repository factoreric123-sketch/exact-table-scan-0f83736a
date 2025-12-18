import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateTempId } from "@/lib/utils/uuid";
import { getErrorMessage } from "@/lib/errorUtils";
import { clearAllMenuCaches, invalidateMenuQueries } from "@/lib/cacheUtils";
import { menuSyncEmitter } from "@/lib/menuSyncEmitter";

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

/**
 * Phase 3: INSTANT sync helper - adds category to full-menu cache
 */
const addCategoryToFullMenuCache = (queryClient: any, newCategory: Category) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    return {
      ...data,
      categories: [...data.categories, { ...newCategory, subcategories: [] }]
    };
  };

  menuSyncEmitter.emitAll(updater);
  
  const fullMenuQueries = queryClient.getQueriesData({ queryKey: ["full-menu"] });
  fullMenuQueries.forEach(([key, data]: [any, any]) => {
    if (data) {
      const updated = updater(data);
      if (updated) queryClient.setQueryData(key, updated);
    }
  });
};

/**
 * Phase 3: INSTANT sync helper - updates category in full-menu cache
 */
const updateCategoryInFullMenuCache = (queryClient: any, categoryId: string, updates: Partial<Category>) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    return {
      ...data,
      categories: data.categories.map((cat: any) =>
        cat.id === categoryId ? { ...cat, ...updates } : cat
      )
    };
  };

  menuSyncEmitter.emitAll(updater);
  
  const fullMenuQueries = queryClient.getQueriesData({ queryKey: ["full-menu"] });
  fullMenuQueries.forEach(([key, data]: [any, any]) => {
    if (data) {
      const updated = updater(data);
      if (updated) queryClient.setQueryData(key, updated);
    }
  });
};

/**
 * Phase 3: INSTANT sync helper - removes category from full-menu cache
 */
const removeCategoryFromFullMenuCache = (queryClient: any, categoryId: string) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    return {
      ...data,
      categories: data.categories.filter((cat: any) => cat.id !== categoryId)
    };
  };

  menuSyncEmitter.emitAll(updater);
  
  const fullMenuQueries = queryClient.getQueriesData({ queryKey: ["full-menu"] });
  fullMenuQueries.forEach(([key, data]: [any, any]) => {
    if (data) {
      const updated = updater(data);
      if (updated) queryClient.setQueryData(key, updated);
    }
  });
};

/**
 * Phase 3: INSTANT sync helper - reorders categories in full-menu cache
 */
const reorderCategoriesInFullMenuCache = (queryClient: any, orderedCategories: { id: string; order_index: number }[]) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    const reordered = [...data.categories].map(cat => {
      const update = orderedCategories.find(u => u.id === cat.id);
      return update ? { ...cat, order_index: update.order_index } : cat;
    }).sort((a, b) => a.order_index - b.order_index);
    
    return { ...data, categories: reordered };
  };

  menuSyncEmitter.emitAll(updater);
  
  const fullMenuQueries = queryClient.getQueriesData({ queryKey: ["full-menu"] });
  fullMenuQueries.forEach(([key, data]: [any, any]) => {
    if (data) {
      const updated = updater(data);
      if (updated) queryClient.setQueryData(key, updated);
    }
  });
};

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
          return [];
        }
        console.log('[useCategories] Categories fetched:', data?.length || 0);
        return (data as Category[]) || [];
      } catch (err) {
        console.error('[useCategories] Exception:', err);
        return [];
      }
    },
    enabled: !!restaurantId && (options?.enabled ?? true),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    placeholderData: (prev) => prev,
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
    onMutate: (category) => {
      if (!category.restaurant_id) return;
      
      // 1. Get previous data (sync)
      const previous = queryClient.getQueryData<Category[]>(["categories", category.restaurant_id]);
      
      // 2. Create temp category (sync)
      const tempCategory: Category = {
        id: generateTempId(),
        restaurant_id: category.restaurant_id,
        name: category.name || "New Category",
        order_index: category.order_index ?? (previous?.length || 0),
        created_at: new Date().toISOString(),
      };
      
      // 3. Cancel queries (sync)
      queryClient.cancelQueries({ queryKey: ["categories", category.restaurant_id] });
      
      // 4. Update categories cache (sync)
      if (previous) {
        queryClient.setQueryData<Category[]>(["categories", category.restaurant_id], [...previous, tempCategory]);
      }
      
      // 5. INSTANT: Emit to full-menu cache (Phase 3)
      addCategoryToFullMenuCache(queryClient, tempCategory);
      
      // 6. Background: clear localStorage
      clearAllMenuCaches(category.restaurant_id);
      
      return { previous, restaurantId: category.restaurant_id };
    },
    onSuccess: (data) => {
      invalidateMenuQueries(queryClient, data.restaurant_id);
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
    onMutate: ({ id, updates }) => {
      // 1. INSTANT: Emit to full-menu cache (Phase 3)
      updateCategoryInFullMenuCache(queryClient, id, updates);
      
      // 2. Find category and get restaurant ID
      const allCategories = queryClient.getQueriesData<Category[]>({ queryKey: ["categories"] });
      let restaurantId: string | null = null;
      let previous: Category[] | undefined;
      
      for (const [key, categories] of allCategories) {
        const category = categories?.find(c => c.id === id);
        if (category) {
          restaurantId = category.restaurant_id;
          previous = categories;
          
          // Update cache
          queryClient.setQueryData<Category[]>(
            key,
            categories.map(c => c.id === id ? { ...c, ...updates } : c)
          );
          break;
        }
      }
      
      if (restaurantId) {
        clearAllMenuCaches(restaurantId);
      }
      
      return { restaurantId, previous };
    },
    onSuccess: (data) => {
      invalidateMenuQueries(queryClient, data.restaurant_id);
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
    onMutate: ({ id, restaurantId }) => {
      // 1. INSTANT: Emit to full-menu cache (Phase 3)
      removeCategoryFromFullMenuCache(queryClient, id);
      
      // 2. Update categories cache
      queryClient.cancelQueries({ queryKey: ["categories", restaurantId] });
      const previous = queryClient.getQueryData<Category[]>(["categories", restaurantId]);
      if (previous) {
        queryClient.setQueryData<Category[]>(
          ["categories", restaurantId],
          previous.filter(c => c.id !== id)
        );
      }
      
      // 3. Clear localStorage
      clearAllMenuCaches(restaurantId);
      
      return { restaurantId, previous };
    },
    onSuccess: (restaurantId) => {
      invalidateMenuQueries(queryClient, restaurantId);
      queryClient.invalidateQueries({ queryKey: ["categories", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Category deleted");
    },
    onError: (_, __, context) => {
      if (context?.previous && context.restaurantId) {
        queryClient.setQueryData(["categories", context.restaurantId], context.previous);
      }
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
      const { error } = await supabase.rpc('batch_update_order_indexes_optimized', {
        table_name: 'categories',
        updates: categories
      });

      if (error) throw error;
    },
    onMutate: ({ categories, restaurantId }) => {
      // 1. INSTANT: Emit to full-menu cache (Phase 3)
      reorderCategoriesInFullMenuCache(queryClient, categories);
      
      // 2. Cancel queries
      queryClient.cancelQueries({ queryKey: ["categories", restaurantId] });

      // 3. Update categories cache
      const previousCategories = queryClient.getQueryData(["categories", restaurantId]);
      if (previousCategories) {
        const optimisticData = (previousCategories as any[]).map(cat => {
          const update = categories.find(u => u.id === cat.id);
          return update ? { ...cat, order_index: update.order_index } : cat;
        }).sort((a, b) => a.order_index - b.order_index);
        
        queryClient.setQueryData(["categories", restaurantId], optimisticData);
      }

      // 4. Clear localStorage
      clearAllMenuCaches(restaurantId);

      return { previousCategories, restaurantId };
    },
    onError: (error, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories", context.restaurantId], context.previousCategories);
      }
      const message = getErrorMessage(error);
      toast.error(`Failed to reorder categories: ${message}`);
    },
    onSettled: (_, __, variables) => {
      invalidateMenuQueries(queryClient, variables.restaurantId);
      queryClient.invalidateQueries({ queryKey: ["categories", variables.restaurantId] });
    },
  });
};
