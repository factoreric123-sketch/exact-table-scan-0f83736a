import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

const CACHE_KEY_PREFIX = 'fullMenu:';
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes - reduced for faster settings updates

interface CacheEntry {
  data: FullMenuData;
  timestamp: number;
  version: string; // Add version based on restaurant updated_at
}

/**
 * Instant menu loading with localStorage cache
 * - Synchronous cache read for instant rendering
 * - Single RPC call to fetch all menu data
 * - Background refresh to keep data fresh
 */
export const useFullMenu = (restaurantId: string | undefined): UseFullMenuReturn => {
  const [data, setData] = useState<FullMenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cacheKey = restaurantId ? `${CACHE_KEY_PREFIX}${restaurantId}` : '';

  // Fetch from database
  const fetchMenu = useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      setIsLoading(true);
      const { data: menuData, error: rpcError } = await supabase.rpc('get_restaurant_full_menu', {
        p_restaurant_id: restaurantId,
      });

      if (rpcError) throw rpcError;

      const parsed = menuData as unknown as FullMenuData;
      setData(parsed);
      
      // Write to cache
      try {
        const entry: CacheEntry = {
          data: parsed,
          timestamp: Date.now(),
          version: parsed?.restaurant?.updated_at || '',
        };
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      } catch (err) {
        console.warn('Failed to cache menu data:', err);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch menu'));
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, cacheKey]);

  // Refetch function for external use
  const refetch = useCallback(async () => {
    if (restaurantId) {
      localStorage.removeItem(cacheKey);
      await fetchMenu();
    }
  }, [restaurantId, cacheKey, fetchMenu]);

  useEffect(() => {
    if (!restaurantId) {
      setIsLoading(false);
      return;
    }

    // Try to read from cache synchronously
    const readCache = (): FullMenuData | null => {
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

        // Check if restaurant settings have changed by comparing version
        const currentVersion = entry.data?.restaurant?.updated_at || '';
        if (entry.version !== currentVersion) {
          localStorage.removeItem(cacheKey);
          return null;
        }

        return entry.data;
      } catch {
        return null;
      }
    };

    // Try cache first
    const cachedData = readCache();
    if (cachedData) {
      setData(cachedData);
      setIsLoading(false);
      // Background refresh
      fetchMenu();
    } else {
      // No cache, fetch immediately
      fetchMenu();
    }
  }, [restaurantId, cacheKey, fetchMenu]);

  return { data, isLoading, error, refetch };
};
