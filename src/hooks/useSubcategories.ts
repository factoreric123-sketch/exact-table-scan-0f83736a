import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateUUID } from "@/lib/utils/uuid";
import { getErrorMessage } from "@/lib/errorUtils";
import { clearAllMenuCaches, invalidateMenuQueries } from "@/lib/cacheUtils";
import { menuSyncEmitter } from "@/lib/menuSyncEmitter";

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

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

/**
 * Phase 3: INSTANT sync helper - adds subcategory to full-menu cache
 */
const addSubcategoryToFullMenuCache = (queryClient: any, categoryId: string, newSubcategory: Subcategory) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    return {
      ...data,
      categories: data.categories.map((cat: any) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subcategories: [...(cat.subcategories || []), { ...newSubcategory, dishes: [] }]
          };
        }
        return cat;
      })
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
 * Phase 3: INSTANT sync helper - updates subcategory in full-menu cache
 */
const updateSubcategoryInFullMenuCache = (queryClient: any, subcategoryId: string, updates: Partial<Subcategory>) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    return {
      ...data,
      categories: data.categories.map((cat: any) => ({
        ...cat,
        subcategories: cat.subcategories?.map((sub: any) =>
          sub.id === subcategoryId ? { ...sub, ...updates } : sub
        )
      }))
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
 * Phase 3: INSTANT sync helper - removes subcategory from full-menu cache
 */
const removeSubcategoryFromFullMenuCache = (queryClient: any, subcategoryId: string) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    return {
      ...data,
      categories: data.categories.map((cat: any) => ({
        ...cat,
        subcategories: cat.subcategories?.filter((sub: any) => sub.id !== subcategoryId)
      }))
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
 * Phase 3: INSTANT sync helper - reorders subcategories in full-menu cache
 */
const reorderSubcategoriesInFullMenuCache = (queryClient: any, categoryId: string, orderedSubcategories: { id: string; order_index: number }[]) => {
  const updater = (data: any) => {
    if (!data?.categories) return null;
    
    return {
      ...data,
      categories: data.categories.map((cat: any) => {
        if (cat.id === categoryId) {
          const reordered = [...(cat.subcategories || [])].map(sub => {
            const update = orderedSubcategories.find(u => u.id === sub.id);
            return update ? { ...sub, order_index: update.order_index } : sub;
          }).sort((a, b) => a.order_index - b.order_index);
          
          return { ...cat, subcategories: reordered };
        }
        return cat;
      })
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
          return [];
        }
        console.log('[useSubcategories] Subcategories fetched:', data?.length || 0);
        return (data as Subcategory[]) || [];
      } catch (err) {
        console.error('[useSubcategories] Exception:', err);
        return [];
      }
    },
    enabled: !!categoryId && (options?.enabled ?? true),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    placeholderData: (prev) => prev,
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
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
  });
};

export const useCreateSubcategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subcategory: Partial<Subcategory> & { id?: string }) => {
      // Use the pre-generated real UUID if provided
      const subcategoryToInsert = {
        ...subcategory,
        id: subcategory.id || generateUUID(),
      };
      
      const { data, error } = await supabase
        .from("subcategories")
        .insert([subcategoryToInsert as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: (subcategory) => {
      if (!subcategory.category_id) return;
      
      // 1. Get previous data (sync)
      const previous = queryClient.getQueryData<Subcategory[]>(["subcategories", subcategory.category_id]);
      
      // 2. Generate REAL UUID (not temp) - same ID will go to database
      const realId = subcategory.id || generateUUID();
      const newSubcategory: Subcategory = {
        id: realId,
        category_id: subcategory.category_id,
        name: subcategory.name || "New Subcategory",
        order_index: subcategory.order_index ?? (previous?.length || 0),
        created_at: new Date().toISOString(),
      };
      
      // 3. Mutate the subcategory object so mutationFn uses the same ID
      subcategory.id = realId;
      
      // 4. Cancel queries (sync)
      queryClient.cancelQueries({ queryKey: ["subcategories", subcategory.category_id] });
      
      // 5. Update subcategories cache (sync)
      if (previous) {
        queryClient.setQueryData<Subcategory[]>(["subcategories", subcategory.category_id], [...previous, newSubcategory]);
      }
      
      // 6. INSTANT: Emit to full-menu cache
      addSubcategoryToFullMenuCache(queryClient, subcategory.category_id, newSubcategory);
      
      // 7. Background: get restaurantId and clear localStorage
      getRestaurantIdFromCategory(subcategory.category_id).then(restaurantId => {
        if (restaurantId) clearAllMenuCaches(restaurantId);
      });
      
      return { previous, categoryId: subcategory.category_id, subcategoryId: realId };
    },
    onSuccess: (data, _, context) => {
      // No replacement needed - ID is already correct!
      getRestaurantIdFromCategory(data.category_id).then(restaurantId => {
        if (restaurantId) {
          invalidateMenuQueries(queryClient, restaurantId);
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ["subcategories", data.category_id] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", "restaurant"] });
    },
    onError: (error, _variables, context) => {
      if (context?.previous && context.categoryId) {
        queryClient.setQueryData(["subcategories", context.categoryId], context.previous);
      }
      // Also remove from full-menu cache on error
      if (context?.subcategoryId) {
        removeSubcategoryFromFullMenuCache(queryClient, context.subcategoryId);
      }
      toast.error("Couldn't create subcategory. Please try again.");
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
    onMutate: ({ id, updates }) => {
      // 1. INSTANT: Emit to full-menu cache (Phase 3)
      updateSubcategoryInFullMenuCache(queryClient, id, updates);
      
      // 2. Find subcategory and update cache
      const allSubcategories = queryClient.getQueriesData<Subcategory[]>({ queryKey: ["subcategories"] });
      let categoryId: string | null = null;
      let previous: Subcategory[] | undefined;
      
      for (const [key, subcategories] of allSubcategories) {
        const subcategory = subcategories?.find(s => s.id === id);
        if (subcategory) {
          categoryId = subcategory.category_id;
          previous = subcategories;
          
          queryClient.setQueryData<Subcategory[]>(
            key,
            subcategories.map(s => s.id === id ? { ...s, ...updates } : s)
          );
          break;
        }
      }
      
      // Background: clear localStorage
      if (categoryId) {
        getRestaurantIdFromCategory(categoryId).then(restaurantId => {
          if (restaurantId) clearAllMenuCaches(restaurantId);
        });
      }
      
      return { categoryId, previous };
    },
    onSuccess: (data) => {
      getRestaurantIdFromCategory(data.category_id).then(restaurantId => {
        if (restaurantId) {
          invalidateMenuQueries(queryClient, restaurantId);
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ["subcategories", data.category_id] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", "restaurant"] });
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
    onMutate: ({ id, categoryId }) => {
      // 1. INSTANT: Emit to full-menu cache (Phase 3)
      removeSubcategoryFromFullMenuCache(queryClient, id);
      
      // 2. Cancel queries
      queryClient.cancelQueries({ queryKey: ["subcategories", categoryId] });
      
      // 3. Update subcategories cache
      const previous = queryClient.getQueryData<Subcategory[]>(["subcategories", categoryId]);
      if (previous) {
        queryClient.setQueryData<Subcategory[]>(
          ["subcategories", categoryId],
          previous.filter(s => s.id !== id)
        );
      }
      
      // 4. Background: clear localStorage
      getRestaurantIdFromCategory(categoryId).then(restaurantId => {
        if (restaurantId) clearAllMenuCaches(restaurantId);
      });
      
      return { categoryId, previous };
    },
    onSuccess: (categoryId) => {
      getRestaurantIdFromCategory(categoryId).then(restaurantId => {
        if (restaurantId) {
          invalidateMenuQueries(queryClient, restaurantId);
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ["subcategories", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", "restaurant"] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Subcategory deleted");
    },
    onError: (_, __, context) => {
      if (context?.previous && context.categoryId) {
        queryClient.setQueryData(["subcategories", context.categoryId], context.previous);
      }
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
      const { error } = await supabase.rpc('batch_update_order_indexes_optimized', {
        table_name: 'subcategories',
        updates: subcategories
      });

      if (error) throw error;
    },
    onMutate: ({ subcategories, categoryId }) => {
      // 1. INSTANT: Emit to full-menu cache (Phase 3)
      reorderSubcategoriesInFullMenuCache(queryClient, categoryId, subcategories);
      
      // 2. Cancel queries
      queryClient.cancelQueries({ queryKey: ["subcategories", categoryId] });

      // 3. Update subcategories cache
      const previousSubcategories = queryClient.getQueryData(["subcategories", categoryId]);
      if (previousSubcategories) {
        const optimisticData = (previousSubcategories as any[]).map(sub => {
          const update = subcategories.find(u => u.id === sub.id);
          return update ? { ...sub, order_index: update.order_index } : sub;
        }).sort((a, b) => a.order_index - b.order_index);
        
        queryClient.setQueryData(["subcategories", categoryId], optimisticData);
      }

      // 4. Background: clear localStorage
      getRestaurantIdFromCategory(categoryId).then(restaurantId => {
        if (restaurantId) clearAllMenuCaches(restaurantId);
      });

      return { previousSubcategories, categoryId };
    },
    onError: (error, variables, context) => {
      if (context?.previousSubcategories) {
        queryClient.setQueryData(["subcategories", context.categoryId], context.previousSubcategories);
      }
      toast.error("Couldn't reorder subcategories. Please try again.");
    },
    onSettled: (_, __, variables) => {
      getRestaurantIdFromCategory(variables.categoryId).then(restaurantId => {
        if (restaurantId) {
          invalidateMenuQueries(queryClient, restaurantId);
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ["subcategories", variables.categoryId] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", "restaurant"] });
    },
  });
};
