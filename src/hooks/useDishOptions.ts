import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DishOption {
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

export const useDishOptions = (dishId: string | undefined) => {
  return useQuery({
    queryKey: ["dish-options", dishId],
    queryFn: async () => {
      if (!dishId) return [];
      
      const { data, error } = await supabase
        .from("dish_options")
        .select("*")
        .eq("dish_id", dishId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as DishOption[];
    },
    enabled: !!dishId && isUuid(dishId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
  });
};
