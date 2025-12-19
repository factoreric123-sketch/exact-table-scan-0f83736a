import { useEffect, useState, useCallback, useRef } from 'react';
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
  useLocalStorageCache?: boolean;
}

const CACHE_KEY_PREFIX = 'fullMenu:';
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

interface CacheEntry {
  data: FullMenuData;
  timestamp: number;
}

/**
 * Production-ready menu loading with instant sync
 * - Phase 1: Fixed race conditions with version tracking
 * - Phase 4: Prevents double-renders with update deduplication
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
  
  // Version tracking to prevent duplicate updates (Phase 4)
  const lastAppliedVersion = useRef(0);
  const hasInitialFetch = useRef(false);
  const isSubscribed = useRef(false);

  // Buffer for updates that arrive before data is loaded
  const pendingBuffer = useRef<Array<{ updater: (d: any) => any; updateId: string; version: number }>>([]);

  const cacheKey = restaurantId ? `${CACHE_KEY_PREFIX}${restaurantId}` : '';

  // Apply buffered updates to data
  const applyBufferedUpdates = useCallback((initialData: FullMenuData): FullMenuData => {
    if (pendingBuffer.current.length === 0) return initialData;
    
    console.log('[useFullMenu] Applying buffered updates:', pendingBuffer.current.length);
    
    let result = initialData;
    pendingBuffer.current.forEach(({ updater, updateId, version }) => {
      if (!menuSyncEmitter.isApplied(updateId)) {
        try {
          const updated = updater(result);
          if (updated) {
            result = updated;
            lastAppliedVersion.current = version;
            console.log('[useFullMenu] Applied buffered update:', updateId);
          }
        } catch (err) {
          console.error('[useFullMenu] Failed to apply buffered update:', updateId, err);
        }
      }
    });
    
    pendingBuffer.current = [];
    return result;
  }, []);

  // Fetch from database
  const fetchMenu = useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      console.log('[useFullMenu] Fetching menu for:', restaurantId);
      setIsLoading(true);
      
      const { data: menuData, error: rpcError } = await supabase.rpc('get_restaurant_full_menu', {
        p_restaurant_id: restaurantId,
      });

      if (rpcError) throw rpcError;

      let parsed = menuData as unknown as FullMenuData;
      
      // Apply any pending updates from emitter
      parsed = menuSyncEmitter.applyPendingUpdates(parsed);
      
      // Apply any locally buffered updates
      parsed = applyBufferedUpdates(parsed);
      
      console.log('[useFullMenu] Menu fetched and updates applied');
      
      setData(parsed);
      queryClient.setQueryData(['full-menu', restaurantId], parsed);
      
      // Cache to localStorage if enabled
      if (useLocalStorageCache) {
        try {
          const entry: CacheEntry = { data: parsed, timestamp: Date.now() };
          localStorage.setItem(cacheKey, JSON.stringify(entry));
        } catch (err) {
          console.warn('[useFullMenu] Failed to cache:', err);
        }
      }
      
      setError(null);
      hasInitialFetch.current = true;
    } catch (err) {
      console.error('[useFullMenu] Fetch error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch menu'));
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, cacheKey, useLocalStorageCache, queryClient, applyBufferedUpdates]);

  // Refetch function
  const refetch = useCallback(async () => {
    if (restaurantId) {
      localStorage.removeItem(cacheKey);
      hasInitialFetch.current = false;
      await fetchMenu();
    }
  }, [restaurantId, cacheKey, fetchMenu]);

  // Subscribe to emitter updates FIRST (before any data loading)
  useEffect(() => {
    if (!restaurantId) return;

    console.log('[useFullMenu] Setting up sync subscription for:', restaurantId);
    isSubscribed.current = true;

    const handleUpdate = (payload: any) => {
      if (payload.type !== 'update' || !payload.updater) return;
      
      const { updater, updateId, version } = payload;
      
      // Skip if already applied (Phase 4: prevent double-renders)
      if (updateId && menuSyncEmitter.isApplied(updateId)) {
        console.log('[useFullMenu] Skipping already applied update:', updateId);
        return;
      }
      
      // Skip if version is older than last applied
      if (version && version <= lastAppliedVersion.current) {
        console.log('[useFullMenu] Skipping older version:', version, 'last:', lastAppliedVersion.current);
        return;
      }

      // Get current data from React Query cache or state
      const currentData = queryClient.getQueryData<FullMenuData>(['full-menu', restaurantId]);
      
      if (currentData) {
        // Apply update immediately
        try {
          const updated = updater(currentData);
          if (updated) {
            console.log('[useFullMenu] Applied update instantly:', updateId);
            setData(updated);
            queryClient.setQueryData(['full-menu', restaurantId], updated);
            if (version) lastAppliedVersion.current = version;
          }
        } catch (err) {
          console.error('[useFullMenu] Failed to apply update:', err);
        }
      } else {
        // Buffer update for when data loads
        console.log('[useFullMenu] Buffering update (no data yet):', updateId);
        pendingBuffer.current.push({ updater, updateId, version });
      }
    };

    const unsubscribe = menuSyncEmitter.subscribe(restaurantId, handleUpdate);
    
    // Flush any pending updates that arrived before subscription
    menuSyncEmitter.flushPendingToListener(handleUpdate);

    return () => {
      isSubscribed.current = false;
      unsubscribe();
    };
  }, [restaurantId, queryClient]);

  // Initialize data from cache or fetch
  useEffect(() => {
    if (!restaurantId) {
      setIsLoading(false);
      return;
    }

    // PRIORITY 1: React Query cache (has optimistic updates)
    const rqCached = queryClient.getQueryData<FullMenuData>(['full-menu', restaurantId]);
    if (rqCached) {
      console.log('[useFullMenu] Using React Query cache');
      let finalData = rqCached;
      
      // Apply any pending updates
      finalData = menuSyncEmitter.applyPendingUpdates(finalData);
      finalData = applyBufferedUpdates(finalData);
      
      setData(finalData);
      setIsLoading(false);
      
      if (!hasInitialFetch.current) {
        // Background fetch to ensure fresh data
        fetchMenu();
      }
      return;
    }

    // PRIORITY 2: localStorage cache
    if (useLocalStorageCache) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          const age = Date.now() - entry.timestamp;

          if (age < CACHE_TTL) {
            console.log('[useFullMenu] Using localStorage cache');
            let finalData = entry.data;
            
            // Apply pending updates
            finalData = menuSyncEmitter.applyPendingUpdates(finalData);
            finalData = applyBufferedUpdates(finalData);
            
            setData(finalData);
            queryClient.setQueryData(['full-menu', restaurantId], finalData);
            setIsLoading(false);
            hasInitialFetch.current = true;
            return;
          } else {
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (err) {
        console.warn('[useFullMenu] localStorage read error:', err);
      }
    }

    // PRIORITY 3: Fetch from database
    console.log('[useFullMenu] No cache, fetching from database');
    fetchMenu();
  }, [restaurantId, cacheKey, fetchMenu, useLocalStorageCache, queryClient, applyBufferedUpdates]);

  // Subscribe to React Query cache changes (for cross-component sync)
  // CRITICAL: This ensures optimistic updates via setQueryData trigger re-renders
  useEffect(() => {
    if (!restaurantId) return;

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.type === 'updated' && 
        event?.query?.queryKey?.[0] === 'full-menu' && 
        event?.query?.queryKey?.[1] === restaurantId
      ) {
        const newData = queryClient.getQueryData<FullMenuData>(['full-menu', restaurantId]);
        // CRITICAL FIX: Always update state when cache changes - don't compare references
        // The previous check `newData !== data` could fail if the update is to nested properties
        if (newData) {
          console.log('[useFullMenu] React Query cache updated, syncing state');
          setData(newData);
        }
      }
    });

    return unsubscribe;
  }, [restaurantId, queryClient]); // Removed `data` from dependencies to prevent stale closure

  return { data, isLoading, error, refetch };
};
