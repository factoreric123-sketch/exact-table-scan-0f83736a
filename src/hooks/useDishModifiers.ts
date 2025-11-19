import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DishModifier {
  id: string;
  dish_id: string;
  name: string;
  price: string;
  order_index: number;
  created_at: string;
}

// Helper to check if a string is a valid UUID
const isUuid = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// Helper to invalidate full menu cache when modifiers change
const invalidateFullMenuCache = async (dishId: string, queryClient: any) => {
  const { data: dish } = await supabase
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

  if (dish?.subcategories?.categories?.restaurant_id) {
    const restaurantId = dish.subcategories.categories.restaurant_id;
    queryClient.invalidateQueries({ queryKey: ["full-menu", restaurantId] });
    localStorage.removeItem(`fullMenu:${restaurantId}`);
  }
};

export const useDishModifiers = (dishId: string) => {
  return useQuery({
    queryKey: ["dish-modifiers", dishId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dish_modifiers")
        .select("*")
        .eq("dish_id", dishId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as DishModifier[];
    },
    enabled: !!dishId && isUuid(dishId),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    placeholderData: (prev) => prev,
  });
};

export const useCreateDishModifier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modifier: Omit<DishModifier, "id" | "created_at">) => {
      // Normalize price - accept various formats
      let normalizedPrice = modifier.price.replace(/[^0-9.+]/g, "");
      if (normalizedPrice && !normalizedPrice.includes(".")) {
        normalizedPrice += ".00";
      } else if (normalizedPrice.split(".")[1]?.length === 1) {
        normalizedPrice += "0";
      }
      
      const { data, error } = await supabase
        .from("dish_modifiers")
        .insert({ ...modifier, price: normalizedPrice || "0.00" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (modifier) => {
      await queryClient.cancelQueries({ queryKey: ["dish-modifiers", modifier.dish_id] });
      const previous = queryClient.getQueryData<DishModifier[]>(["dish-modifiers", modifier.dish_id]);
      // Do not add optimistic temp rows to avoid duplicates/glitches across views
      return { previous, dishId: modifier.dish_id };
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dish-modifiers", variables.dish_id] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["subcategory-dishes-with-options"] });
      await invalidateFullMenuCache(variables.dish_id, queryClient);
      toast.success("Modifier added");
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.dishId) {
        queryClient.setQueryData(["dish-modifiers", context.dishId], context.previous);
      }
    },
  });
};

export const useUpdateDishModifier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DishModifier> }) => {
      // Normalize price if provided to prevent resets/glitches
      const payload: Partial<DishModifier> = { ...updates };
      if (typeof updates.price === "string") {
        let normalizedPrice = updates.price.replace(/[^0-9.]/g, "");
        if (normalizedPrice && !normalizedPrice.includes(".")) {
          normalizedPrice += ".00";
        } else if (normalizedPrice.split(".")[1]?.length === 1) {
          normalizedPrice += "0";
        }
        payload.price = normalizedPrice || "0.00";
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
    onMutate: async ({ id, updates }) => {
      const allModifiers = queryClient.getQueriesData<DishModifier[]>({ queryKey: ["dish-modifiers"] });
      const modifier = allModifiers.flatMap(([, data]) => data || []).find((m) => m.id === id);
      
      if (modifier) {
        await queryClient.cancelQueries({ queryKey: ["dish-modifiers", modifier.dish_id] });
        const previous = queryClient.getQueryData<DishModifier[]>(["dish-modifiers", modifier.dish_id]);
        
        if (previous) {
          queryClient.setQueryData<DishModifier[]>(
            ["dish-modifiers", modifier.dish_id],
            previous.map((m) => (m.id === id ? { ...m, ...updates } : m))
          );
        }
        
        return { previous, dishId: modifier.dish_id };
      }
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["dish-modifiers", data.dish_id] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["subcategory-dishes-with-options"] });
      await invalidateFullMenuCache(data.dish_id, queryClient);
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.dishId) {
        queryClient.setQueryData(["dish-modifiers", context.dishId], context.previous);
      }
    },
  });
};

export const useDeleteDishModifier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dishId }: { id: string; dishId: string }) => {
      const { error } = await supabase
        .from("dish_modifiers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { dishId };
    },
    onMutate: async ({ id, dishId }) => {
      await queryClient.cancelQueries({ queryKey: ["dish-modifiers", dishId] });
      const previous = queryClient.getQueryData<DishModifier[]>(["dish-modifiers", dishId]);
      
      if (previous) {
        queryClient.setQueryData<DishModifier[]>(
          ["dish-modifiers", dishId],
          previous.filter((m) => m.id !== id)
        );
      }
      
      return { previous, dishId };
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dish-modifiers", variables.dishId] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["subcategory-dishes-with-options"] });
      await invalidateFullMenuCache(variables.dishId, queryClient);
      toast.success("Modifier deleted");
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.dishId) {
        queryClient.setQueryData(["dish-modifiers", context.dishId], context.previous);
      }
    },
  });
};

export const useUpdateDishModifiersOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ modifiers, dishId }: { modifiers: DishModifier[]; dishId: string }) => {
      const updates = modifiers.map((modifier) => ({
        id: modifier.id,
        order_index: modifier.order_index,
      }));

      const { error } = await supabase.rpc("batch_update_order_indexes_optimized", {
        table_name: "dish_modifiers",
        updates: updates,
      });

      if (error) throw error;
      return { dishId };
    },
    onMutate: async ({ modifiers, dishId }) => {
      await queryClient.cancelQueries({ queryKey: ["dish-modifiers", dishId] });
      
      const previousModifiers = queryClient.getQueryData<DishModifier[]>(["dish-modifiers", dishId]);
      
      queryClient.setQueryData<DishModifier[]>(["dish-modifiers", dishId], modifiers);
      
      return { previousModifiers, dishId };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousModifiers) {
        queryClient.setQueryData(["dish-modifiers", context.dishId], context.previousModifiers);
      }
    },
    onSettled: async (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dish-modifiers", variables.dishId] });
      await invalidateFullMenuCache(variables.dishId, queryClient);
    },
  });
};
