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
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    placeholderData: (prev) => prev,
  });
};

export const useCreateDishOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (option: Omit<DishOption, "id" | "created_at">) => {
      // Normalize price - accept various formats
      let normalizedPrice = option.price.replace(/[^0-9.]/g, "");
      if (normalizedPrice && !normalizedPrice.includes(".")) {
        normalizedPrice += ".00";
      } else if (normalizedPrice.split(".")[1]?.length === 1) {
        normalizedPrice += "0";
      }
      
      const { data, error } = await supabase
        .from("dish_options")
        .insert({ ...option, price: normalizedPrice || "0.00" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (option) => {
      await queryClient.cancelQueries({ queryKey: ["dish-options", option.dish_id] });
      const previous = queryClient.getQueryData<DishOption[]>(["dish-options", option.dish_id]);
      
      if (previous) {
        const tempOption: DishOption = {
          id: `temp-${Date.now()}`,
          ...option,
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<DishOption[]>(["dish-options", option.dish_id], [...previous, tempOption]);
      }
      
      return { previous, dishId: option.dish_id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dish-options", variables.dish_id] });
      toast.success("Option added");
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.dishId) {
        queryClient.setQueryData(["dish-options", context.dishId], context.previous);
      }
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
    onMutate: async ({ id, updates }) => {
      const allOptions = queryClient.getQueriesData<DishOption[]>({ queryKey: ["dish-options"] });
      const option = allOptions.flatMap(([, data]) => data || []).find((o) => o.id === id);
      
      if (option) {
        await queryClient.cancelQueries({ queryKey: ["dish-options", option.dish_id] });
        const previous = queryClient.getQueryData<DishOption[]>(["dish-options", option.dish_id]);
        
        if (previous) {
          queryClient.setQueryData<DishOption[]>(
            ["dish-options", option.dish_id],
            previous.map((o) => (o.id === id ? { ...o, ...updates } : o))
          );
        }
        
        return { previous, dishId: option.dish_id };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dish-options", data.dish_id] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.dishId) {
        queryClient.setQueryData(["dish-options", context.dishId], context.previous);
      }
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
    onMutate: async ({ id, dishId }) => {
      await queryClient.cancelQueries({ queryKey: ["dish-options", dishId] });
      const previous = queryClient.getQueryData<DishOption[]>(["dish-options", dishId]);
      
      if (previous) {
        queryClient.setQueryData<DishOption[]>(
          ["dish-options", dishId],
          previous.filter((o) => o.id !== id)
        );
      }
      
      return { previous, dishId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dish-options", variables.dishId] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Option deleted");
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.dishId) {
        queryClient.setQueryData(["dish-options", context.dishId], context.previous);
      }
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

      const { error } = await supabase.rpc("batch_update_order_indexes_optimized", {
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
