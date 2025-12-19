import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DishOption } from "./useDishOptions";
import type { DishModifier } from "./useDishModifiers";
import { toast } from "sonner";
import { menuSyncEmitter } from "@/lib/menuSyncEmitter";

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
// Now also syncs to full-menu cache for preview/live menu display
// CRITICAL: Also updates has_options flag to instantly reflect enable/disable toggle

export const applyOptimisticOptionsUpdate = (
  queryClient: any,
  dishId: string,
  restaurantId: string,
  newOptions: DishOption[],
  newModifiers: DishModifier[],
  hasOptions?: boolean // NEW: Pass has_options flag to update dish state
) => {
  // 1. Instantly update dish-options cache (synchronous, ~0ms)
  queryClient.setQueryData(["dish-options", dishId], newOptions);
  
  // 2. Instantly update dish-modifiers cache (synchronous, ~0ms)
  queryClient.setQueryData(["dish-modifiers", dishId], newModifiers);
  
  // 3. CRITICAL: Update full-menu cache so preview/live menu shows new options
  // Also update has_options flag for instant enable/disable sync
  menuSyncEmitter.emitAll((menuData: any) => {
    if (!menuData?.categories) return menuData;
    
    const updatedCategories = menuData.categories.map((cat: any) => ({
      ...cat,
      subcategories: cat.subcategories?.map((sub: any) => ({
        ...sub,
        dishes: sub.dishes?.map((dish: any) => {
          if (dish.id === dishId) {
            // Update options, modifiers, AND has_options flag on the dish
            return {
              ...dish,
              // CRITICAL: Update has_options flag for instant toggle sync
              ...(hasOptions !== undefined && { has_options: hasOptions, hasOptions: hasOptions }),
              options: newOptions.map(opt => ({
                id: opt.id,
                name: opt.name,
                price: opt.price,
                order_index: opt.order_index
              })),
              modifiers: newModifiers.map(mod => ({
                id: mod.id,
                name: mod.name,
                price: mod.price,
                order_index: mod.order_index
              }))
            };
          }
          return dish;
        }) || []
      })) || []
    }));
    
    return { ...menuData, categories: updatedCategories };
  });
  
  // 4. Also update React Query full-menu cache directly
  const currentFullMenu = queryClient.getQueryData(['full-menu', restaurantId]);
  if (currentFullMenu) {
    const updatedMenu = {
      ...currentFullMenu,
      categories: (currentFullMenu as any).categories?.map((cat: any) => ({
        ...cat,
        subcategories: cat.subcategories?.map((sub: any) => ({
          ...sub,
          dishes: sub.dishes?.map((dish: any) => {
            if (dish.id === dishId) {
              return {
                ...dish,
                // CRITICAL: Update has_options flag for instant toggle sync
                ...(hasOptions !== undefined && { has_options: hasOptions, hasOptions: hasOptions }),
                options: newOptions.map(opt => ({
                  id: opt.id,
                  name: opt.name,
                  price: opt.price,
                  order_index: opt.order_index
                })),
                modifiers: newModifiers.map(mod => ({
                  id: mod.id,
                  name: mod.name,
                  price: mod.price,
                  order_index: mod.order_index
                }))
              };
            }
            return dish;
          }) || []
        })) || []
      })) || []
    };
    queryClient.setQueryData(['full-menu', restaurantId], updatedMenu);
  }
  
  // 5. Clear localStorage cache - ultra low priority, truly non-blocking
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      try { localStorage.removeItem(`fullMenu:${restaurantId}`); } catch {}
    }, { timeout: 5000 });
  }
};

// ============= BACKGROUND MUTATION EXECUTOR =============
// Fire-and-forget with error recovery

export interface MutationTask {
  type: 'create-option' | 'update-option' | 'delete-option' | 'create-modifier' | 'update-modifier' | 'delete-modifier' | 'update-dish';
  name: string;
  execute: () => Promise<any>;
}

export const executeBackgroundMutations = (
  tasks: MutationTask[],
  dishId: string,
  restaurantId: string,
  queryClient: any
) => {
  if (tasks.length === 0) return;

  // FIRE AND FORGET - Execute in background, don't await
  // This function returns immediately, mutations happen async
  setTimeout(() => {
    Promise.allSettled(
      tasks.map(task => task.execute())
    ).then(results => {
      const failed = results.filter(r => r.status === 'rejected');
      
      if (failed.length > 0) {
        // Retry failed ones once
        const failedTasks = tasks.filter((_, i) => results[i].status === 'rejected');
        
        Promise.allSettled(failedTasks.map(t => t.execute())).then(retryResults => {
          const stillFailed = retryResults.filter(r => r.status === 'rejected');
          
          if (stillFailed.length > 0) {
            const failedNames = failedTasks
              .filter((_, i) => retryResults[i].status === 'rejected')
              .map(t => t.name)
              .slice(0, 2);
            
            toast.error(`Failed to save: ${failedNames.join(", ")}`, {
              action: {
                label: "Refresh",
                onClick: () => {
                  queryClient.invalidateQueries({ queryKey: ["dish-options", dishId] });
                  queryClient.invalidateQueries({ queryKey: ["dish-modifiers", dishId] });
                }
              }
            });
          }
        });
      }
    });
  }, 0);
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
