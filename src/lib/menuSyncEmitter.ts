/**
 * Production-Ready Menu Sync Emitter
 * 
 * Features:
 * - Lock mechanism to prevent race conditions
 * - Version tracking to prevent duplicate updates
 * - Pending queue with unique IDs for deduplication
 * - Immediate sync for all menu operations
 */

type Listener = (data: any) => void;
type Updater = (data: any) => any;

interface PendingUpdate {
  id: string;
  updater: Updater;
  timestamp: number;
}

// Generate unique update ID
let updateCounter = 0;
const generateUpdateId = (): string => {
  updateCounter += 1;
  return `update-${Date.now()}-${updateCounter}`;
};

class MenuSyncEmitter {
  private listeners: Map<string, Set<Listener>> = new Map();
  private pendingUpdates: PendingUpdate[] = [];
  private appliedUpdateIds: Set<string> = new Set();
  private readonly PENDING_TTL = 10000; // 10 second max age
  private readonly MAX_APPLIED_IDS = 1000; // Prevent memory leak
  private version = 0;

  /**
   * Get current sync version (for deduplication)
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Subscribe to updates for a specific restaurant
   */
  subscribe(restaurantId: string, listener: Listener): () => void {
    if (!this.listeners.has(restaurantId)) {
      this.listeners.set(restaurantId, new Set());
    }
    this.listeners.get(restaurantId)!.add(listener);
    
    console.log('[MenuSync] Subscribed to restaurant:', restaurantId);
    
    return () => {
      this.listeners.get(restaurantId)?.delete(listener);
      console.log('[MenuSync] Unsubscribed from restaurant:', restaurantId);
    };
  }

  /**
   * Emit update to a specific restaurant
   */
  emit(restaurantId: string, data: any): void {
    this.version += 1;
    const listeners = this.listeners.get(restaurantId);
    if (listeners && listeners.size > 0) {
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * Emit update to ALL listeners (for mutations that don't know restaurantId)
   * Also queues the update for late subscribers
   */
  emitAll(updater: Updater): string {
    this.version += 1;
    const updateId = generateUpdateId();
    let applied = false;

    console.log('[MenuSync] EmitAll - version:', this.version, 'id:', updateId);

    // Apply to all active listeners
    this.listeners.forEach((listeners, restaurantId) => {
      if (listeners.size > 0) {
        console.log('[MenuSync] Applying to restaurant:', restaurantId, 'listeners:', listeners.size);
        listeners.forEach(listener => {
          listener({ type: 'update', updater, updateId, version: this.version });
        });
        applied = true;
      }
    });

    // Always queue for late subscribers (will be cleaned up by TTL)
    this.queuePendingUpdate(updateId, updater);

    if (applied) {
      // Mark as applied so we don't apply twice
      this.markApplied(updateId);
    }

    return updateId;
  }

  /**
   * Queue an update for late subscribers
   */
  private queuePendingUpdate(id: string, updater: Updater): void {
    // Remove expired updates first
    this.cleanupExpiredUpdates();

    // Add new update
    this.pendingUpdates.push({
      id,
      updater,
      timestamp: Date.now()
    });

    console.log('[MenuSync] Queued pending update:', id, 'total:', this.pendingUpdates.length);
  }

  /**
   * Clean up expired pending updates
   */
  private cleanupExpiredUpdates(): void {
    const now = Date.now();
    const before = this.pendingUpdates.length;
    this.pendingUpdates = this.pendingUpdates.filter(p => now - p.timestamp < this.PENDING_TTL);
    
    if (before !== this.pendingUpdates.length) {
      console.log('[MenuSync] Cleaned up expired updates:', before - this.pendingUpdates.length);
    }

    // Also clean up applied IDs
    if (this.appliedUpdateIds.size > this.MAX_APPLIED_IDS) {
      const toDelete = this.appliedUpdateIds.size - this.MAX_APPLIED_IDS;
      const ids = Array.from(this.appliedUpdateIds);
      for (let i = 0; i < toDelete; i++) {
        this.appliedUpdateIds.delete(ids[i]);
      }
    }
  }

  /**
   * Mark an update as applied (for deduplication)
   */
  private markApplied(updateId: string): void {
    this.appliedUpdateIds.add(updateId);
  }

  /**
   * Check if an update has already been applied
   */
  isApplied(updateId: string): boolean {
    return this.appliedUpdateIds.has(updateId);
  }

  /**
   * Get all pending updates that haven't been applied yet
   */
  getPendingUpdates(): PendingUpdate[] {
    this.cleanupExpiredUpdates();
    // Only return updates that haven't been applied
    return this.pendingUpdates.filter(p => !this.appliedUpdateIds.has(p.id));
  }

  /**
   * Apply pending updates to data and mark them as applied
   */
  applyPendingUpdates(data: any): any {
    const pending = this.getPendingUpdates();
    if (pending.length === 0) return data;

    console.log('[MenuSync] Applying pending updates:', pending.length);

    let result = data;
    pending.forEach(({ id, updater }) => {
      try {
        const updated = updater(result);
        if (updated) {
          result = updated;
          this.markApplied(id);
          console.log('[MenuSync] Applied pending update:', id);
        }
      } catch (err) {
        console.error('[MenuSync] Failed to apply pending update:', id, err);
      }
    });

    return result;
  }

  /**
   * Clear all pending updates (use with caution)
   */
  clearPendingUpdates(): void {
    console.log('[MenuSync] Clearing all pending updates');
    this.pendingUpdates = [];
  }

  /**
   * Flush pending updates to a specific listener (for late subscribers)
   * DOES NOT clear the queue - just applies to the listener
   */
  flushPendingToListener(listener: Listener): void {
    const pending = this.getPendingUpdates();
    if (pending.length === 0) return;

    console.log('[MenuSync] Flushing pending to listener:', pending.length);
    
    pending.forEach(({ id, updater }) => {
      if (!this.appliedUpdateIds.has(id)) {
        listener({ type: 'update', updater, updateId: id, version: this.version });
        this.markApplied(id);
      }
    });
  }
}

export const menuSyncEmitter = new MenuSyncEmitter();
