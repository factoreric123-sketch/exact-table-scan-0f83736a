import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Theme } from "@/lib/types/theme";
import { generateTempId } from "@/lib/utils/uuid";
import { logger } from "@/lib/logger";

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  hero_image_url: string | null;
  theme: Theme | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  allergen_filter_order?: string[];
  dietary_filter_order?: string[];
  badge_display_order?: string[];
  editor_view_mode?: 'grid' | 'table';
  show_allergen_filter?: boolean;
}

export const useRestaurants = () => {
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Restaurant[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - restaurants don't change often
    gcTime: 1000 * 60 * 15, // 15 minutes cache
  });
};

export const useRestaurant = (slug: string) => {
  return useQuery({
    queryKey: ["restaurant", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Restaurant | null;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 3, // 3 minutes - public menus are mostly static
    gcTime: 1000 * 60 * 20, // 20 minutes cache
  });
};

export const useRestaurantById = (id: string) => {
  return useQuery({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as Restaurant;
    },
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds - editor needs fresher data
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });
};

export const useCreateRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (restaurant: Partial<Restaurant>) => {
      const { data, error } = await supabase
        .from("restaurants")
        .insert([restaurant as any])
        .select()
        .single();

      if (error) throw error;
      
      const newRestaurant = data as unknown as Restaurant;
      
      // Always create default category and subcategory for new restaurants
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .insert([{
          restaurant_id: newRestaurant.id,
          name: "Menu",
          order_index: 0,
        }])
        .select()
        .single();

      if (categoryError) {
        logger.error("Failed to create default category:", categoryError);
      } else {
        // Create default subcategory
        const { error: subcategoryError } = await supabase
          .from("subcategories")
          .insert([{
            category_id: categoryData.id,
            name: "Appetizers",
            order_index: 0,
          }]);
        
        if (subcategoryError) {
          logger.error("Failed to create default subcategory:", subcategoryError);
        }
      }
      
      return newRestaurant;
    },
    onMutate: async (restaurant) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["restaurants"] });
      const previous = queryClient.getQueryData<Restaurant[]>(["restaurants"]);
      
      // Optimistically add new restaurant to the list
      if (previous && restaurant.owner_id) {
        const tempRestaurant: Restaurant = {
          id: generateTempId(),
          owner_id: restaurant.owner_id,
          name: restaurant.name || "New Restaurant",
          slug: restaurant.slug || "new-restaurant",
          tagline: restaurant.tagline || null,
          hero_image_url: restaurant.hero_image_url || null,
          theme: restaurant.theme || null,
          published: restaurant.published || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData<Restaurant[]>(["restaurants"], [tempRestaurant, ...previous]);
      }
      
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success("Restaurant created");
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["restaurants"], context.previous);
      }
      toast.error(error.message || "Failed to create restaurant");
    },
  });
};

export const useUpdateRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Restaurant> }) => {
      const { data, error } = await supabase
        .from("restaurants")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Restaurant;
    },
    onMutate: async ({ id, updates }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["restaurant", id] });
      const previous = queryClient.getQueryData<Restaurant>(["restaurant", id]);
      
      if (previous) {
        queryClient.setQueryData<Restaurant>(["restaurant", id], { ...previous, ...updates });
      }
      
      return { previous };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant", data.id] });
      queryClient.invalidateQueries({ queryKey: ["restaurant", data.slug] });
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["restaurant", id], context.previous);
      }
    },
  });
};

export const useDeleteRestaurant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("restaurants")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      // Optimistic delete
      await queryClient.cancelQueries({ queryKey: ["restaurants"] });
      const previous = queryClient.getQueryData<Restaurant[]>(["restaurants"]);
      
      if (previous) {
        queryClient.setQueryData<Restaurant[]>(
          ["restaurants"],
          previous.filter((r) => r.id !== id)
        );
      }
      
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success("Restaurant deleted");
    },
    onError: (error: Error, _id, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["restaurants"], context.previous);
      }
      toast.error(error.message || "Failed to delete restaurant");
    },
  });
};
