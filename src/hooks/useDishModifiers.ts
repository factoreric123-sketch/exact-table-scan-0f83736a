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
    enabled: !!dishId,
  });
};

export const useCreateDishModifier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modifier: Omit<DishModifier, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("dish_modifiers")
        .insert(modifier)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dish-modifiers", variables.dish_id] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
};

export const useUpdateDishModifier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DishModifier> }) => {
      const { data, error } = await supabase
        .from("dish_modifiers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dish-modifiers", data.dish_id] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dish-modifiers", variables.dishId] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Modifier deleted");
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

      const { error } = await supabase.rpc("batch_update_order_indexes", {
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
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dish-modifiers", variables.dishId] });
    },
  });
};
