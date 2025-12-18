/**
 * Ultra-fast menu sync emitter
 * Bypasses React Query subscription overhead for instant updates
 */

type Listener = (data: any) => void;

class MenuSyncEmitter {
  private listeners: Map<string, Set<Listener>> = new Map();

  subscribe(restaurantId: string, listener: Listener): () => void {
    if (!this.listeners.has(restaurantId)) {
      this.listeners.set(restaurantId, new Set());
    }
    this.listeners.get(restaurantId)!.add(listener);
    
    return () => {
      this.listeners.get(restaurantId)?.delete(listener);
    };
  }

  emit(restaurantId: string, data: any): void {
    // Synchronous - no microtask delay
    this.listeners.get(restaurantId)?.forEach(listener => listener(data));
  }

  // For mutations that don't know restaurantId - emit to ALL
  emitAll(updater: (data: any) => any): void {
    this.listeners.forEach((listeners, restaurantId) => {
      listeners.forEach(listener => {
        // Listener will handle the update
        listener({ type: 'update', updater });
      });
    });
  }
}

export const menuSyncEmitter = new MenuSyncEmitter();
