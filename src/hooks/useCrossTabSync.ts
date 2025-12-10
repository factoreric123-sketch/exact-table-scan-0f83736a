import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type SyncMessage = {
  type: 'invalidate-menu' | 'invalidate-restaurant';
  restaurantId?: string;
  slug?: string;
};

const CHANNEL_NAME = 'taptab-sync';

/**
 * Cross-tab cache synchronization using BroadcastChannel API
 * When a restaurant is updated in one tab, other tabs will invalidate their caches
 */
export const useCrossTabSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);

    const handleMessage = (event: MessageEvent<SyncMessage>) => {
      const { type, restaurantId, slug } = event.data;

      switch (type) {
        case 'invalidate-menu':
          if (restaurantId) {
            queryClient.invalidateQueries({ queryKey: ['full-menu', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
            // Clear localStorage cache
            try {
              localStorage.removeItem(`fullMenu:${restaurantId}`);
            } catch {}
          }
          if (slug) {
            queryClient.invalidateQueries({ queryKey: ['restaurant', slug] });
          }
          break;

        case 'invalidate-restaurant':
          if (restaurantId) {
            queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
          }
          if (slug) {
            queryClient.invalidateQueries({ queryKey: ['restaurant', slug] });
          }
          queryClient.invalidateQueries({ queryKey: ['restaurants'] });
          break;
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [queryClient]);
};

/**
 * Broadcast a cache invalidation message to other tabs
 */
export const broadcastMenuInvalidation = (restaurantId: string, slug?: string) => {
  if (typeof BroadcastChannel === 'undefined') return;

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({
      type: 'invalidate-menu',
      restaurantId,
      slug,
    } satisfies SyncMessage);
    channel.close();
  } catch {
    // Silently fail if broadcast fails
  }
};

/**
 * Broadcast a restaurant update to other tabs
 */
export const broadcastRestaurantInvalidation = (restaurantId: string, slug?: string) => {
  if (typeof BroadcastChannel === 'undefined') return;

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({
      type: 'invalidate-restaurant',
      restaurantId,
      slug,
    } satisfies SyncMessage);
    channel.close();
  } catch {
    // Silently fail if broadcast fails
  }
};