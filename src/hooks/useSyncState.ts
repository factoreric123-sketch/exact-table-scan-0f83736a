import { useState, useEffect, useCallback } from 'react';
import { syncStateManager } from '@/lib/syncStateManager';

/**
 * React hook to consume sync state from the centralized manager
 * Automatically re-renders when sync state changes
 */
export const useSyncState = () => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Subscribe to sync state changes
    const unsubscribe = syncStateManager.subscribe(() => {
      forceUpdate({});
    });

    return unsubscribe;
  }, []);

  const isDishSyncing = useCallback((id: string): boolean => {
    return syncStateManager.isDishSyncing(id);
  }, []);

  const isImageSyncing = useCallback((id: string): boolean => {
    return syncStateManager.isImageSyncing(id);
  }, []);

  const hasAnySyncing = useCallback((): boolean => {
    return syncStateManager.hasAnySyncing();
  }, []);

  const getSyncingDishIds = useCallback((): string[] => {
    return syncStateManager.getSyncingDishIds();
  }, []);

  const getSyncingImageIds = useCallback((): string[] => {
    return syncStateManager.getSyncingImageIds();
  }, []);

  return {
    isDishSyncing,
    isImageSyncing,
    hasAnySyncing,
    getSyncingDishIds,
    getSyncingImageIds,
  };
};
