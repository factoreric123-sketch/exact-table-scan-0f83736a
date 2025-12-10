import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const SYNC_CHANNEL_NAME = 'menu-sync';

type MenuSyncMessage = {
  type: 'menu-updated' | 'restaurant-updated' | 'publish-changed';
  restaurantId: string;
  timestamp: number;
};

/**
 * Cross-tab and real-time menu synchronization
 * Ensures Visual Editor Preview and Live Menu are always in sync
 */
export const useMenuSync = (restaurantId: string | undefined) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Invalidate all menu-related caches for a restaurant
  const invalidateMenuCache = useCallback((targetRestaurantId: string) => {
    // Clear React Query caches - ALL menu-related queries
    queryClient.invalidateQueries({ queryKey: ['full-menu', targetRestaurantId] });
    queryClient.invalidateQueries({ queryKey: ['restaurant', targetRestaurantId] });
    queryClient.invalidateQueries({ queryKey: ['categories', targetRestaurantId] });
    queryClient.invalidateQueries({ queryKey: ['subcategories'] });
    queryClient.invalidateQueries({ queryKey: ['dishes'] });
    queryClient.invalidateQueries({ queryKey: ['all-dishes-for-category'] });
    queryClient.invalidateQueries({ queryKey: ['dish-options'] });
    queryClient.invalidateQueries({ queryKey: ['dish-modifiers'] });
    queryClient.invalidateQueries({ queryKey: ['public-menu-dishes'] }); // Live Menu dishes
    queryClient.invalidateQueries({ queryKey: ['subcategory-dishes-with-options'] }); // Preview dishes
    
    // Clear localStorage cache
    try {
      localStorage.removeItem(`fullMenu:${targetRestaurantId}`);
    } catch {
      // Ignore localStorage errors
    }
  }, [queryClient]);

  // Setup BroadcastChannel for cross-tab sync
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    channelRef.current = channel;

    const handleMessage = (event: MessageEvent<MenuSyncMessage>) => {
      const { type, restaurantId: msgRestaurantId } = event.data;
      
      // Only process messages for current restaurant or if viewing live menu
      if (restaurantId && msgRestaurantId !== restaurantId) return;
      if (!restaurantId && !msgRestaurantId) return;

      const targetId = msgRestaurantId || restaurantId;
      if (!targetId) return;

      switch (type) {
        case 'menu-updated':
        case 'restaurant-updated':
        case 'publish-changed':
          invalidateMenuCache(targetId);
          break;
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      channelRef.current = null;
    };
  }, [restaurantId, invalidateMenuCache]);

  // Broadcast menu update to other tabs using persistent channel
  const broadcastMenuUpdate = useCallback((type: MenuSyncMessage['type'] = 'menu-updated') => {
    if (!restaurantId) return;
    if (typeof BroadcastChannel === 'undefined') return;

    try {
      // Use the persistent channel ref if available, otherwise create temporary
      if (channelRef.current) {
        channelRef.current.postMessage({
          type,
          restaurantId,
          timestamp: Date.now(),
        } satisfies MenuSyncMessage);
      } else {
        // Fallback: create temporary channel
        const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channel.postMessage({
          type,
          restaurantId,
          timestamp: Date.now(),
        } satisfies MenuSyncMessage);
        channel.close();
      }
    } catch {
      // Silently fail
    }
  }, [restaurantId]);

  return { 
    invalidateMenuCache, 
    broadcastMenuUpdate,
  };
};

/**
 * Real-time subscription for live menu updates
 * Subscribe to restaurant table changes for instant sync
 */
export const useRealtimeMenuUpdates = (restaurantId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!restaurantId) return;

    // Subscribe to restaurant changes (theme, settings, publish state)
    const restaurantChannel = supabase
      .channel(`restaurant-changes-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
          filter: `id=eq.${restaurantId}`,
        },
        () => {
          // Restaurant updated - refresh menu
          queryClient.invalidateQueries({ queryKey: ['full-menu', restaurantId] });
          queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
          localStorage.removeItem(`fullMenu:${restaurantId}`);
        }
      )
      .subscribe();

    // Subscribe to dishes changes
    const dishesChannel = supabase
      .channel(`dishes-changes-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dishes',
        },
        () => {
          // Dishes updated - refresh ALL menu views instantly
          queryClient.invalidateQueries({ queryKey: ['full-menu', restaurantId] });
          queryClient.invalidateQueries({ queryKey: ['dishes'] });
          queryClient.invalidateQueries({ queryKey: ['all-dishes-for-category'] });
          queryClient.invalidateQueries({ queryKey: ['public-menu-dishes'] });
          queryClient.invalidateQueries({ queryKey: ['subcategory-dishes-with-options'] });
          queryClient.invalidateQueries({ queryKey: ['dish-options'] });
          queryClient.invalidateQueries({ queryKey: ['dish-modifiers'] });
          localStorage.removeItem(`fullMenu:${restaurantId}`);
        }
      )
      .subscribe();

    // Subscribe to categories changes
    const categoriesChannel = supabase
      .channel(`categories-changes-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['full-menu', restaurantId] });
          queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
          localStorage.removeItem(`fullMenu:${restaurantId}`);
        }
      )
      .subscribe();

    // Subscribe to subcategories changes
    const subcategoriesChannel = supabase
      .channel(`subcategories-changes-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subcategories',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['full-menu', restaurantId] });
          queryClient.invalidateQueries({ queryKey: ['subcategories'] });
          localStorage.removeItem(`fullMenu:${restaurantId}`);
        }
      )
      .subscribe();

    // Subscribe to dish_options changes
    const optionsChannel = supabase
      .channel(`options-changes-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dish_options',
        },
        () => {
          // Options updated - refresh ALL menu views instantly
          queryClient.invalidateQueries({ queryKey: ['full-menu', restaurantId] });
          queryClient.invalidateQueries({ queryKey: ['dish-options'] });
          queryClient.invalidateQueries({ queryKey: ['dishes'] });
          queryClient.invalidateQueries({ queryKey: ['public-menu-dishes'] });
          queryClient.invalidateQueries({ queryKey: ['subcategory-dishes-with-options'] });
          localStorage.removeItem(`fullMenu:${restaurantId}`);
        }
      )
      .subscribe();

    // Subscribe to dish_modifiers changes
    const modifiersChannel = supabase
      .channel(`modifiers-changes-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dish_modifiers',
        },
        () => {
          // Modifiers updated - refresh ALL menu views instantly
          queryClient.invalidateQueries({ queryKey: ['full-menu', restaurantId] });
          queryClient.invalidateQueries({ queryKey: ['dish-modifiers'] });
          queryClient.invalidateQueries({ queryKey: ['dishes'] });
          queryClient.invalidateQueries({ queryKey: ['public-menu-dishes'] });
          queryClient.invalidateQueries({ queryKey: ['subcategory-dishes-with-options'] });
          localStorage.removeItem(`fullMenu:${restaurantId}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(restaurantChannel);
      supabase.removeChannel(dishesChannel);
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(subcategoriesChannel);
      supabase.removeChannel(optionsChannel);
      supabase.removeChannel(modifiersChannel);
    };
  }, [restaurantId, queryClient]);
};

/**
 * Broadcast helper for use in mutation hooks
 * Creates a temporary channel for one-time broadcast
 */
let sharedBroadcastChannel: BroadcastChannel | null = null;

export const broadcastMenuChange = (restaurantId: string, type: MenuSyncMessage['type'] = 'menu-updated') => {
  if (typeof BroadcastChannel === 'undefined') return;

  try {
    // Reuse shared channel if available
    if (!sharedBroadcastChannel) {
      sharedBroadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    }
    
    sharedBroadcastChannel.postMessage({
      type,
      restaurantId,
      timestamp: Date.now(),
    } satisfies MenuSyncMessage);
  } catch {
    // On error, reset and try to recreate
    sharedBroadcastChannel = null;
  }
};
