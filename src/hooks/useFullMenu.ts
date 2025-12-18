import { useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { menuSyncEmitter } from '@/lib/menuSyncEmitter';

interface FullMenuData {
  restaurant: any;
  categories: any[];
}

interface UseFullMenuReturn {
  data: FullMenuData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseFullMenuOptions {
  /**
   * Whether to use localStorage caching (default: true)
   * Set to false for Editor Preview to ensure fresh data
   */
  useLocalStorageCache?: boolean;
}

const CACHE_KEY_PREFIX = 'fullMenu:';
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

interface CacheEntry {
  data: FullMenuData;
  timestamp: number;
}

/**
 * Menu loading with optional localStorage cache
 * - For Live Menu: Uses localStorage for fast initial load
 * - For Editor Preview: Skips localStorage, uses React Query cache only
 */
export const useFullMenu = (
  restaurantId: string | undefined, 
  options: UseFullMenuOptions = {}
): UseFullMenuReturn => {
  const { useLocalStorageCache = true } = options;
  const [data, setData] = useState<FullMenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  
  // Track if we've done initial fetch to prevent background refresh overwriting optimistic updates
  const hasInitialFetch = useRef(false);

  const cacheKey = restaurantId ? `${CACHE_KEY_PREFIX}${restaurantId}` : '';

  // Fetch from database
  const fetchMenu = useCallback(async (forceRefresh: boolean = false) => {
    if (!restaurantId) return;
    
    try {
      setIsLoading(true);
      const { data: menuData, error: rpcError } = await supabase.rpc('get_restaurant_full_menu', {
        p_restaurant_id: restaurantId,
      });

      if (rpcError) throw rpcError;

      const parsed = menuData as unknown as FullMenuData;
      setData(parsed);
      
      // Update React Query cache for instant access by other components
      queryClient.setQueryData(['full-menu', restaurantId], parsed);
      
      // Only write to localStorage if enabled (not for Editor Preview)
      if (useLocalStorageCache) {
        try {
          const entry: CacheEntry = {
            data: parsed,
            timestamp: Date.now(),
          };
          localStorage.setItem(cacheKey, JSON.stringify(entry));
        } catch (err) {
          console.warn('Failed to cache menu data:', err);
        }
      }
      
      setError(null);
      hasInitialFetch.current = true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch menu'));
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, cacheKey, useLocalStorageCache, queryClient]);

  // Refetch function for external use
  const refetch = useCallback(async () => {
    if (restaurantId) {
      // Always clear localStorage on refetch
      localStorage.removeItem(cacheKey);
      hasInitialFetch.current = false;
      await fetchMenu(true);
    }
  }, [restaurantId, cacheKey, fetchMenu]);

  useEffect(() => {
    if (!restaurantId) {
      setIsLoading(false);
      return;
    }

    // PRIORITY 1: Check React Query cache FIRST (has optimistic updates)
    const rqCached = queryClient.getQueryData<FullMenuData>(['full-menu', restaurantId]);
    if (rqCached) {
      setData(rqCached);
      setIsLoading(false);
      // DON'T do background refresh here - it would overwrite optimistic updates!
      // Only fetch if we haven't done initial fetch yet
      if (!hasInitialFetch.current) {
        fetchMenu();
      }
      return;
    }

    // PRIORITY 2: Check localStorage cache (only if enabled)
    if (useLocalStorageCache) {
      const readLocalStorageCache = (): FullMenuData | null => {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (!cached) return null;

          const entry: CacheEntry = JSON.parse(cached);
          const age = Date.now() - entry.timestamp;

          // Check if cache is expired
          if (age > CACHE_TTL) {
            localStorage.removeItem(cacheKey);
            return null;
          }

          return entry.data;
        } catch {
          return null;
        }
      };

      const cachedData = readLocalStorageCache();
      if (cachedData) {
        setData(cachedData);
        setIsLoading(false);
        // Update React Query cache so optimistic updates work
        queryClient.setQueryData(['full-menu', restaurantId], cachedData);
        hasInitialFetch.current = true;
        // DON'T do background refresh - wait for explicit invalidation
        return;
      }
    }

    // PRIORITY 3: No cache, fetch immediately
    fetchMenu();
  }, [restaurantId, cacheKey, fetchMenu, useLocalStorageCache, queryClient]);

  // Use ref to hold current data for instant sync (avoids dependency on data state)
  const dataRef = useRef<FullMenuData | null>(data);
  dataRef.current = data;

  // INSTANT sync via direct event emitter - bypasses all React Query overhead
  useEffect(() => {
    if (!restaurantId) return;

    const unsubscribe = menuSyncEmitter.subscribe(restaurantId, (payload) => {
      if (payload.type === 'update' && payload.updater) {
        // Apply the update function directly to current data via ref
        const currentData = dataRef.current;
        if (currentData) {
          const updated = payload.updater(currentData);
          if (updated) {
            setData(updated);
            queryClient.setQueryData(['full-menu', restaurantId], updated);
          }
        }
      } else if (payload.type === 'full') {
        setData(payload.data);
        queryClient.setQueryData(['full-menu', restaurantId], payload.data);
      }
    });

    return unsubscribe;
  }, [restaurantId, queryClient]); // NO data dependency - subscription is stable!

  return { data, isLoading, error, refetch };
};
