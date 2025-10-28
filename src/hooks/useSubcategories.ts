import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export const useSubcategories = (categoryId: string) => {
  return useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", categoryId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Subcategory[];
    },
    enabled: !!categoryId,
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
  });
};

export const useCreateSubcategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subcategory: Partial<Subcategory>) => {
      const { data, error } = await supabase
        .from("subcategories")
        .insert([subcategory as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subcategories", data.category_id] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", "restaurant"] });
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
    onSuccess: (data) => {
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
    onSuccess: (categoryId) => {
      queryClient.invalidateQueries({ queryKey: ["subcategories", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["subcategories", "restaurant"] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Subcategory deleted");
    },
  });
};

export const useUpdateSubcategoriesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subcategories }: { subcategories: { id: string; order_index: number }[] }) => {
      const updates = subcategories.map((sub) =>
        supabase
          .from("subcategories")
          .update({ order_index: sub.order_index })
          .eq("id", sub.id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });
};
