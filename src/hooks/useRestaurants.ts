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
  show_prices?: boolean;
  show_images?: boolean;
  layout_density?: 'compact' | 'spacious';
  grid_columns?: 1 | 2 | 3;
  menu_font_size?: 'small' | 'medium' | 'large';
  image_size?: 'compact' | 'large';
  badge_colors?: {
    new_addition: string;
    special: string;
    popular: string;
    chef_recommendation: string;
  };
}

export const useRestaurants = () => {
  const { data } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => supabase.auth.getSession(),
  });

  const userId = data?.data?.session?.user?.id;

  return useQuery({
    queryKey: ["restaurants", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", userId) // Explicitly filter by owner
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Restaurant[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes - restaurants don't change often
    gcTime: 1000 * 60 * 15, // 15 minutes cache
  });
};

export const useRestaurant = (slug: string) => {
  // Normalize slug to avoid passing route placeholders like ":slug"
  const normalizedSlug = (slug || '')
    .trim()
    .replace(/^:+/, '') // remove leading colon(s)
    .replace(/^menu\//, '') // strip optional /menu/ prefix if present
    .split('/')
    .filter(Boolean)
    .pop()?.toLowerCase() || '';

  console.log('[useRestaurant] Normalized slug:', { input: slug, normalized: normalizedSlug });

  return useQuery({
    queryKey: ["restaurant", normalizedSlug],
    queryFn: async () => {
      if (!normalizedSlug) {
        console.log('[useRestaurant] No slug provided, returning null');
        return null;
      }
      
      try {
        console.log('[useRestaurant] Querying restaurant with slug:', normalizedSlug);
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("slug", normalizedSlug)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('[useRestaurant] Query error:', error);
          // Don't throw - return null and let enabled: false handle it
          return null;
        }
        
        console.log('[useRestaurant] Query result:', data ? 'FOUND' : 'NOT FOUND');
        return data as unknown as Restaurant | null;
      } catch (err) {
        console.error('[useRestaurant] Query exception:', err);
        // Never throw - return null
        return null;
      }
    },
    enabled: !!normalizedSlug,
    staleTime: 1000 * 60 * 3, // 3 minutes - public menus are mostly static
    gcTime: 1000 * 60 * 20, // 20 minutes cache
    // CRITICAL: Never throw
    retry: 3,
    throwOnError: false,
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
    staleTime: 0, // Always refetch to get latest settings instantly
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
      const userId = restaurant.owner_id;
      await queryClient.cancelQueries({ queryKey: ["restaurants", userId] });
      const previous = queryClient.getQueryData<Restaurant[]>(["restaurants", userId]);
      
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
        queryClient.setQueryData<Restaurant[]>(["restaurants", restaurant.owner_id], [tempRestaurant, ...previous]);
      }
      
      return { previous };
    },
      onSuccess: (data) => {
        // Only invalidate the current user's restaurants
        queryClient.invalidateQueries({ queryKey: ["restaurants", data.owner_id] });
        toast.success("Restaurant created");
      },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previous && _variables.owner_id) {
        queryClient.setQueryData(["restaurants", _variables.owner_id], context.previous);
      }
      toast.error(error.message || "Failed to create restaurant");
    },
  });
};

export const useUpdateRestaurant = () => {
  const queryClient = useQueryClient();
  const { data: sessionData } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => supabase.auth.getSession(),
  });
  
  const userId = sessionData?.data?.session?.user?.id;

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
      // Update all restaurant caches
      queryClient.setQueryData(["restaurant", data.id], data);
      queryClient.setQueryData(["restaurant", data.slug], data);
      
      // Invalidate list queries
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["restaurants", userId] });
      }
      queryClient.invalidateQueries({ queryKey: ["restaurant", data.id] });
      queryClient.invalidateQueries({ queryKey: ["restaurant", data.slug] });
      
      // CRITICAL: Invalidate full menu cache for public menu updates
      queryClient.invalidateQueries({ queryKey: ["full-menu", data.id] });
      
      // CRITICAL: Clear localStorage cache for instant public menu updates
      const cacheKey = `fullMenu:${data.id}`;
      try {
        localStorage.removeItem(cacheKey);
      } catch (err) {
        console.warn('Failed to clear menu cache:', err);
      }
      
      // Invalidate all-dishes-for-category for editor preview
      queryClient.invalidateQueries({ queryKey: ["all-dishes-for-category"] });
      
      toast.success("Settings updated");
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["restaurant", id], context.previous);
      }
      logger.error('Failed to update restaurant', { error });
      toast.error("Failed to update settings");
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
      // Get all restaurant query keys to update all user caches
      const queries = queryClient.getQueriesData<Restaurant[]>({ queryKey: ["restaurants"] });
      const contexts: any[] = [];
      
      for (const [queryKey, previous] of queries) {
        if (previous) {
          await queryClient.cancelQueries({ queryKey });
          queryClient.setQueryData<Restaurant[]>(
            queryKey,
            previous.filter((r) => r.id !== id)
          );
          contexts.push({ queryKey, previous });
        }
      }
      
      return { contexts };
    },
      onSuccess: (_, deletedId) => {
        // Invalidate all restaurant queries to catch any cached data
        queryClient.invalidateQueries({ queryKey: ["restaurants"] });
        toast.success("Restaurant deleted");
      },
    onError: (error: Error, _id, context) => {
      // Rollback on error
      if (context?.contexts) {
        for (const { queryKey, previous } of context.contexts) {
          queryClient.setQueryData(queryKey, previous);
        }
      }
      toast.error(error.message || "Failed to delete restaurant");
    },
  });
};
