import { useMutation } from "@tanstack/react-query";
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
export const applyOptimisticOptionsUpdate = (
  queryClient: any,
  dishId: string,
  restaurantId: string,
  newOptions: DishOption[],
  newModifiers: DishModifier[]
) => {
  // 1. Instantly update dish-options cache (synchronous, ~0ms)
  queryClient.setQueryData(["dish-options", dishId], newOptions);
  
  // 2. Instantly update dish-modifiers cache (synchronous, ~0ms)
  queryClient.setQueryData(["dish-modifiers", dishId], newModifiers);
  
  // 3. Clear localStorage cache - ultra low priority, truly non-blocking
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      try { localStorage.removeItem(`fullMenu:${restaurantId}`); } catch {}
    }, { timeout: 5000 });
  }
};

// ============= BACKGROUND MUTATION EXECUTOR =============
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

  // Track failed tasks for persistent error recovery
  let persistentFailures: MutationTask[] = [];

  setTimeout(() => {
    Promise.allSettled(
      tasks.map(task => task.execute())
    ).then(results => {
      const failed = results.filter(r => r.status === 'rejected');
      
      if (failed.length > 0) {
        const failedTasks = tasks.filter((_, i) => results[i].status === 'rejected');
        
        // First retry attempt
        Promise.allSettled(failedTasks.map(t => t.execute())).then(retryResults => {
          const stillFailed = retryResults.filter(r => r.status === 'rejected');
          
          if (stillFailed.length > 0) {
            persistentFailures = failedTasks.filter((_, i) => retryResults[i].status === 'rejected');
            const failedNames = persistentFailures.map(t => t.name).slice(0, 3);
            
            // Show persistent error toast with retry action
            toast.error(`Failed to save ${persistentFailures.length} item(s): ${failedNames.join(", ")}`, {
              duration: 10000, // Keep visible longer
              action: {
                label: "Retry",
                onClick: () => {
                  // Retry all failed mutations
                  toast.promise(
                    Promise.allSettled(persistentFailures.map(t => t.execute())).then(finalResults => {
                      const finalFailed = finalResults.filter(r => r.status === 'rejected');
                      if (finalFailed.length > 0) {
                        throw new Error(`${finalFailed.length} items still failed`);
                      }
                      // Refresh data on success
                      queryClient.invalidateQueries({ queryKey: ["dish-options", dishId] });
                      queryClient.invalidateQueries({ queryKey: ["dish-modifiers", dishId] });
                      queryClient.invalidateQueries({ queryKey: ["full-menu", restaurantId] });
                    }),
                    {
                      loading: "Retrying...",
                      success: "All items saved successfully!",
                      error: "Some items still failed. Please try again.",
                    }
                  );
                }
              },
              description: "Your changes may not have been saved. Click Retry to try again.",
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
