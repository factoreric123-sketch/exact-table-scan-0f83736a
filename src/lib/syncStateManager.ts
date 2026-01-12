/**
 * SyncStateManager - Centralized tracking of syncing dishes and images
 * Ensures UI shows loading state instead of false/incomplete data
 */

type Listener = () => void;

class SyncStateManager {
  private syncingDishes: Set<string> = new Set();
  private syncingImages: Set<string> = new Set();
  private listeners: Set<Listener> = new Set();

  // Mark dish as syncing (during creation/update)
  startDishSync(dishId: string): void {
    if (!this.syncingDishes.has(dishId)) {
      this.syncingDishes.add(dishId);
      console.log('[SyncStateManager] Started dish sync:', dishId);
      this.notifyListeners();
    }
  }

  endDishSync(dishId: string): void {
    if (this.syncingDishes.has(dishId)) {
      this.syncingDishes.delete(dishId);
      console.log('[SyncStateManager] Ended dish sync:', dishId);
      this.notifyListeners();
    }
  }

  // Mark image as uploading
  startImageSync(dishId: string): void {
    if (!this.syncingImages.has(dishId)) {
      this.syncingImages.add(dishId);
      console.log('[SyncStateManager] Started image sync:', dishId);
      this.notifyListeners();
    }
  }

  endImageSync(dishId: string): void {
    if (this.syncingImages.has(dishId)) {
      this.syncingImages.delete(dishId);
      console.log('[SyncStateManager] Ended image sync:', dishId);
      this.notifyListeners();
    }
  }

  // Check sync status
  isDishSyncing(dishId: string): boolean {
    return this.syncingDishes.has(dishId);
  }

  isImageSyncing(dishId: string): boolean {
    return this.syncingImages.has(dishId);
  }

  hasAnySyncing(): boolean {
    return this.syncingDishes.size > 0 || this.syncingImages.size > 0;
  }

  getSyncingDishIds(): string[] {
    return Array.from(this.syncingDishes);
  }

  getSyncingImageIds(): string[] {
    return Array.from(this.syncingImages);
  }

  // Subscribe to changes
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (err) {
        console.error('[SyncStateManager] Listener error:', err);
      }
    });
  }

  // Clear all sync states (useful for cleanup)
  clear(): void {
    this.syncingDishes.clear();
    this.syncingImages.clear();
    this.notifyListeners();
  }
}

// Singleton instance
export const syncStateManager = new SyncStateManager();
