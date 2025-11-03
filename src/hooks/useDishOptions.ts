import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DishOption {
  id: string;
  dish_id: string;
  name: string;
  price: string;
  order_index: number;
  created_at: string;
}

export const useDishOptions = (dishId: string) => {
  return useQuery({
    queryKey: ["dish-options", dishId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dish_options")
        .select("*")
        .eq("dish_id", dishId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as DishOption[];
    },
    enabled: !!dishId,
  });
};

export const useCreateDishOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (option: Omit<DishOption, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("dish_options")
        .insert(option)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dish-options", variables.dish_id] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
};

export const useUpdateDishOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DishOption> }) => {
      const { data, error } = await supabase
        .from("dish_options")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dish-options", data.dish_id] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
};

export const useDeleteDishOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dishId }: { id: string; dishId: string }) => {
      const { error } = await supabase
        .from("dish_options")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { dishId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dish-options", variables.dishId] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Option deleted");
    },
  });
};

export const useUpdateDishOptionsOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ options, dishId }: { options: DishOption[]; dishId: string }) => {
      const updates = options.map((option) => ({
        id: option.id,
        order_index: option.order_index,
      }));

      const { error } = await supabase.rpc("batch_update_order_indexes", {
        table_name: "dish_options",
        updates: updates,
      });

      if (error) throw error;
      return { dishId };
    },
    onMutate: async ({ options, dishId }) => {
      await queryClient.cancelQueries({ queryKey: ["dish-options", dishId] });
      
      const previousOptions = queryClient.getQueryData<DishOption[]>(["dish-options", dishId]);
      
      queryClient.setQueryData<DishOption[]>(["dish-options", dishId], options);
      
      return { previousOptions, dishId };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousOptions) {
        queryClient.setQueryData(["dish-options", context.dishId], context.previousOptions);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dish-options", variables.dishId] });
    },
  });
};
