/**
 * Ultra-fast menu sync emitter with pending queue
 * Bypasses React Query subscription overhead for instant updates
 * Queues updates that arrive before listeners exist
 */

type Listener = (data: any) => void;
type Updater = (data: any) => any;

interface PendingUpdate {
  updater: Updater;
  timestamp: number;
}

class MenuSyncEmitter {
  private listeners: Map<string, Set<Listener>> = new Map();
  private pendingUpdates: Map<string, PendingUpdate[]> = new Map();
  private readonly PENDING_TTL = 5000; // 5 second max age for pending updates

  subscribe(restaurantId: string, listener: Listener): () => void {
    if (!this.listeners.has(restaurantId)) {
      this.listeners.set(restaurantId, new Set());
    }
    this.listeners.get(restaurantId)!.add(listener);
    
    // Flush any pending updates to this new listener
    this.flushPending(restaurantId, listener);
    
    return () => {
      this.listeners.get(restaurantId)?.delete(listener);
    };
  }

  private flushPending(restaurantId: string, listener: Listener): void {
    const pending = this.pendingUpdates.get(restaurantId);
    if (!pending || pending.length === 0) return;
    
    const now = Date.now();
    // Filter out expired updates and apply the rest
    const validUpdates = pending.filter(p => now - p.timestamp < this.PENDING_TTL);
    
    // Apply all valid pending updates in order
    validUpdates.forEach(({ updater }) => {
      listener({ type: 'update', updater });
    });
    
    // Clear pending queue for this restaurant
    this.pendingUpdates.delete(restaurantId);
  }

  emit(restaurantId: string, data: any): void {
    // Synchronous - no microtask delay
    this.listeners.get(restaurantId)?.forEach(listener => listener(data));
  }

  // For mutations that don't know restaurantId - emit to ALL listeners
  // If no listeners exist or no data exists, queue the update
  emitAll(updater: Updater): void {
    let updated = false;
    
    this.listeners.forEach((listeners, restaurantId) => {
      if (listeners.size > 0) {
        listeners.forEach(listener => {
          listener({ type: 'update', updater });
        });
        updated = true;
      }
    });
    
    // Always queue updates - they'll be applied when data loads if not applied now
    if (!this.pendingUpdates.has('__global__')) {
      this.pendingUpdates.set('__global__', []);
    }
    this.pendingUpdates.get('__global__')!.push({
      updater,
      timestamp: Date.now()
    });
  }

  // Get pending updates for applying after initial data load
  getPendingUpdates(): PendingUpdate[] {
    const globalPending = this.pendingUpdates.get('__global__');
    if (!globalPending) return [];
    
    const now = Date.now();
    return globalPending.filter(p => now - p.timestamp < this.PENDING_TTL);
  }

  // Clear pending updates after they've been applied
  clearPendingUpdates(): void {
    this.pendingUpdates.delete('__global__');
  }

  // Check and flush global pending updates for a specific restaurant
  flushGlobalPending(restaurantId: string, listener: Listener): void {
    const globalPending = this.pendingUpdates.get('__global__');
    if (!globalPending || globalPending.length === 0) return;
    
    const now = Date.now();
    const validUpdates = globalPending.filter(p => now - p.timestamp < this.PENDING_TTL);
    
    validUpdates.forEach(({ updater }) => {
      listener({ type: 'update', updater });
    });
    
    // Clear global pending
    this.pendingUpdates.delete('__global__');
  }
}

export const menuSyncEmitter = new MenuSyncEmitter();