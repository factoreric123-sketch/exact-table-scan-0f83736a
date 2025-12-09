import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DishOption } from "./useDishOptions";
import type { DishModifier } from "./useDishModifiers";
import { toast } from "sonner";

// Client-side price normalization - INSTANT, no async
export const normalizePrice = (price: string): string => {
  let normalized = "";
  let hasDecimal = false;
  
  for (const char of price) {
    if (char >= '0' && char <= '9') {
      normalized += char;
    } else if (char === '.' && !hasDecimal) {
      normalized += char;
      hasDecimal = true;
    }
  }
  
  if (normalized && !hasDecimal) {
    normalized += ".00";
  } else if (normalized.split(".")[1]?.length === 1) {
    normalized += "0";
  }
  
  return normalized || "0.00";
};

// ============= OPTIMISTIC CACHE UPDATE - INSTANT =============
// This is the key to Apple-quality speed: update cache BEFORE network

export const applyOptimisticOptionsUpdate = (
  queryClient: any,
  dishId: string,
  restaurantId: string,
  newOptions: DishOption[],
  newModifiers: DishModifier[]
) => {
  // 1. Instantly update dish-options cache
  queryClient.setQueryData(["dish-options", dishId], newOptions);
  
  // 2. Instantly update dish-modifiers cache
  queryClient.setQueryData(["dish-modifiers", dishId], newModifiers);
  
  // 3. Invalidate broader queries in background (non-blocking)
  queueMicrotask(() => {
    queryClient.invalidateQueries({ queryKey: ["dishes"] });
    queryClient.invalidateQueries({ queryKey: ["subcategory-dishes-with-options"] });
    queryClient.invalidateQueries({ queryKey: ["full-menu", restaurantId] });
    
    // Clear localStorage cache asynchronously
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        localStorage.removeItem(`fullMenu:${restaurantId}`);
      });
    } else {
      setTimeout(() => {
        localStorage.removeItem(`fullMenu:${restaurantId}`);
      }, 0);
    }
  });
};

// ============= BACKGROUND MUTATION EXECUTOR =============
// Fire-and-forget with error recovery

export interface MutationTask {
  type: 'create-option' | 'update-option' | 'delete-option' | 'create-modifier' | 'update-modifier' | 'delete-modifier' | 'update-dish';
  name: string;
  execute: () => Promise<any>;
}

export const executeBackgroundMutations = async (
  tasks: MutationTask[],
  dishId: string,
  restaurantId: string,
  queryClient: any
) => {
  if (tasks.length === 0) return;

  // Execute ALL mutations in parallel - maximum speed
  const results = await Promise.allSettled(
    tasks.map(task => 
      task.execute().catch(async (error) => {
        // Single retry on failure
        await new Promise(r => setTimeout(r, 300));
        return task.execute();
      })
    )
  );

  const failed = results.filter(r => r.status === 'rejected');
  
  if (failed.length > 0) {
    // Find which tasks failed
    const failedNames = tasks
      .filter((_, i) => results[i].status === 'rejected')
      .map(t => t.name)
      .slice(0, 3);
    
    const message = failedNames.length < failed.length
      ? `Failed: ${failedNames.join(", ")} and ${failed.length - failedNames.length} more`
      : `Failed: ${failedNames.join(", ")}`;
    
    toast.error(message, {
      action: {
        label: "Retry",
        onClick: () => {
          // Invalidate to refetch fresh data
          queryClient.invalidateQueries({ queryKey: ["dish-options", dishId] });
          queryClient.invalidateQueries({ queryKey: ["dish-modifiers", dishId] });
        }
      }
    });
    
    // Invalidate caches to sync with server state
    queryClient.invalidateQueries({ queryKey: ["dish-options", dishId] });
    queryClient.invalidateQueries({ queryKey: ["dish-modifiers", dishId] });
    queryClient.invalidateQueries({ queryKey: ["dishes"] });
    
    if (restaurantId) {
      queryClient.invalidateQueries({ queryKey: ["full-menu", restaurantId] });
      localStorage.removeItem(`fullMenu:${restaurantId}`);
    }
  }
};

// ============= SILENT MUTATIONS (No toasts, for background execution) =============

export const useCreateDishOptionSilent = () => {
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
  });
};

export const useUpdateDishOptionSilent = () => {
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

// Legacy function - kept for compatibility but no longer used in optimistic flow
export const invalidateAllCaches = async (dishId: string, queryClient: any) => {
  // Get restaurant ID synchronously from existing cache if possible
  const dishes = queryClient.getQueryData(["dishes"]) as any[];
  const dish = dishes?.find((d: any) => d.id === dishId);
  
  let restaurantId: string | null = null;
  
  if (dish?.subcategories?.categories?.restaurant_id) {
    restaurantId = dish.subcategories.categories.restaurant_id;
  } else {
    // Fallback: fetch from DB (slower path)
    const { data } = await supabase
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
    
    restaurantId = data?.subcategories?.categories?.restaurant_id || null;
  }
  
  // Batch invalidations
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["dish-options", dishId] }),
    queryClient.invalidateQueries({ queryKey: ["dish-modifiers", dishId] }),
    queryClient.invalidateQueries({ queryKey: ["dishes"] }),
    queryClient.invalidateQueries({ queryKey: ["subcategory-dishes-with-options"] }),
    ...(restaurantId ? [queryClient.invalidateQueries({ queryKey: ["full-menu", restaurantId] })] : []),
  ]);
  
  if (restaurantId) {
    localStorage.removeItem(`fullMenu:${restaurantId}`);
  }
};
