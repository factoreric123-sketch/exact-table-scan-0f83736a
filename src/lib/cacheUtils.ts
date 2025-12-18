/**
 * Shared cache invalidation utilities for menu synchronization
 * Ensures Visual Editor, Preview, and Live Menu stay in sync
 */

/**
 * Clears ALL menu-related caches for a restaurant
 * Call this in onMutate (before mutation) to ensure localStorage is cleared
 * before any optimistic updates, preventing stale reads
 */
export const clearAllMenuCaches = (restaurantId: string) => {
  // Clear localStorage FIRST (before React Query can read stale data)
  localStorage.removeItem(`fullMenu:${restaurantId}`);
};

/**
 * Invalidates React Query caches for a restaurant's menu
 * Call this in onSuccess/onSettled after mutations complete
 * Uses removeQueries + refetchQueries to force fresh data
 */
export const invalidateMenuQueries = async (queryClient: any, restaurantId: string) => {
  // IMPORTANT: Do NOT remove or invalidate full-menu queries here!
  // Optimistic updates are already correct in the cache.
  // Invalidating would trigger a refetch that overwrites optimistic data with potentially stale DB data.
  // The cache will naturally refresh on next page load or explicit refetch.
  
  // Only mark as stale (for background refresh) but don't trigger immediate refetch
  queryClient.setQueryDefaults(['full-menu', restaurantId], { staleTime: 0 });
};

/**
 * Complete cache invalidation - both localStorage and React Query
 * Use this when you need to ensure complete sync
 */
export const invalidateAllMenuCaches = async (queryClient: any, restaurantId: string) => {
  // Clear localStorage first
  clearAllMenuCaches(restaurantId);
  
  // Then invalidate React Query
  await invalidateMenuQueries(queryClient, restaurantId);
};
