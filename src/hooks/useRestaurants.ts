import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  hero_image_url: string | null;
  theme: any;
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
      return data as Restaurant[];
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
      return data as Restaurant | null;
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
      return data as Restaurant;
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success("Restaurant created successfully!");
    },
    onError: (error: any) => {
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
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant", data.id] });
      queryClient.invalidateQueries({ queryKey: ["restaurant", data.slug] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success("Restaurant deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete restaurant");
    },
  });
};
