/**
 * Core functionality for check-in desk: registry, events, and plugins.
 * Optimized for performance with hybrid registry representation.
 */

import {
  shallowRef,
  computed,
  nextTick,
  type ComputedRef,
  type ShallowRef,
} from 'vue';
import type { CheckInPlugin } from './types';

// ==========================================
// TYPES
// ==========================================

/** Type d'événement émis par le desk */
export type DeskEventType = 'check-in' | 'check-out' | 'update' | 'clear';

/** Callback pour les événements du desk */
export type DeskEventCallback<T = any> = (payload: {
  id?: string | number;
  data?: T;
  timestamp: number;
}) => void;

export interface CheckInItem<T = any> {
  id: string | number;
  data: T;
  timestamp?: number;
  meta?: Record<string, any>;
}

export interface DeskCoreOptions<T = any> {
  onBeforeCheckIn?: (id: string | number, data: T) => boolean | undefined;
  onCheckIn?: (id: string | number, data: T) => void;
  onBeforeCheckOut?: (id: string | number) => boolean | undefined;
  onCheckOut?: (id: string | number) => void;
  debug?: boolean;
  plugins?: CheckInPlugin<T>[];
}

export interface DeskCore<T = any> {
  /**
   * ⚠️ INTERNAL: Map registry - DO NOT use directly in templates.
   * Use get(), getAll(), or computed helpers instead.
   */
  readonly registryMap: Map<string | number, CheckInItem<T>>;
  
  /**
   * Reactive list representation (optimized for Vue reactivity)
   */
  readonly registryList: ShallowRef<CheckInItem<T>[]>;
  
  /**
   * Sorted registry computed (cached, only recalculates when needed)
   */
  readonly sortedRegistry: ComputedRef<CheckInItem<T>[]>;
  
  checkIn: (id: string | number, data: T, meta?: Record<string, any>) => boolean;
  checkOut: (id: string | number) => boolean;
  get: (id: string | number) => CheckInItem<T> | undefined;
  getAll: (options?: {
    sortBy?: keyof T | 'timestamp';
    order?: 'asc' | 'desc';
  }) => CheckInItem<T>[];
  update: (id: string | number, data: Partial<T>) => boolean;
  has: (id: string | number) => boolean;
  clear: () => void;
  checkInMany: (items: Array<{ id: string | number; data: T; meta?: Record<string, any> }>) => void;
  checkOutMany: (ids: Array<string | number>) => void;
  updateMany: (updates: Array<{ id: string | number; data: Partial<T> }>) => void;
  on: (event: DeskEventType, callback: DeskEventCallback<T>) => () => void;
  off: (event: DeskEventType, callback: DeskEventCallback<T>) => void;
  emit: (event: DeskEventType, payload: { id?: string | number; data?: T }) => void;
}

// ==========================================
// DEBUG HELPERS
// ==========================================

const NoOpDebug = (_message: string, ..._args: any[]) => {};
const Debug = (message: string, ...args: any[]) => {
  console.log(`[DeskCore] ${message}`, ...args);
};

// ==========================================
// EVENT BATCHING SYSTEM
// ==========================================

/**
 * Event batching system to prevent event avalanche.
 * Groups multiple events into a single microtask.
 */
class EventBatcher<T = any> {
  private pendingEvents: Map<
    DeskEventType,
    Array<{ id?: string | number; data?: T; timestamp: number }>
  > = new Map();
  private flushScheduled = false;
  private listeners: Map<DeskEventType, Set<DeskEventCallback<T>>>;

  constructor(listeners: Map<DeskEventType, Set<DeskEventCallback<T>>>) {
    this.listeners = listeners;
  }

  /**
   * Adds an event to the batch queue
   */
  add(event: DeskEventType, payload: { id?: string | number; data?: T }) {
    if (!this.pendingEvents.has(event)) {
      this.pendingEvents.set(event, []);
    }
    
    this.pendingEvents.get(event)!.push({
      ...payload,
      timestamp: Date.now(),
    });

    // Schedule flush if not already scheduled
    if (!this.flushScheduled) {
      this.flushScheduled = true;
      nextTick(() => this.flush());
    }
  }

  /**
   * Flushes all pending events
   */
  private flush() {
    this.pendingEvents.forEach((payloads, event) => {
      const listeners = this.listeners.get(event);
      if (!listeners || listeners.size === 0) return;

      // Emit each payload to each listener
      payloads.forEach((payload) => {
        listeners.forEach((callback) => callback(payload));
      });
    });

    // Clear batch
    this.pendingEvents.clear();
    this.flushScheduled = false;
  }

  /**
   * Immediately emits an event without batching
   */
  emitImmediate(event: DeskEventType, payload: { id?: string | number; data?: T; timestamp: number }) {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    listeners.forEach((callback) => callback(payload));
  }
}

// ==========================================
// SORTED REGISTRY CACHE
// ==========================================

/**
 * LRU cache for sorted registry results.
 * Avoids recalculating sort on every getAll() call.
 */
class SortedRegistryCache<T = any> {
  private cache: Map<string, { result: CheckInItem<T>[]; timestamp: number }> = new Map();
  private maxSize = 10; // Keep last 10 sort configurations
  private registryVersion = 0;

  /**
   * Generate cache key from sort options
   */
  private getCacheKey(options?: { sortBy?: keyof T | 'timestamp'; order?: 'asc' | 'desc' }): string {
    if (!options?.sortBy) return 'unsorted';
    return `${String(options.sortBy)}-${options.order || 'asc'}`;
  }

  /**
   * Get cached sorted result if valid
   */
  get(
    options?: { sortBy?: keyof T | 'timestamp'; order?: 'asc' | 'desc' }
  ): CheckInItem<T>[] | null {
    const key = this.getCacheKey(options);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    if (cached.timestamp < this.registryVersion) return null;
    
    return cached.result;
  }

  /**
   * Store sorted result in cache
   */
  set(
    result: CheckInItem<T>[],
    options?: { sortBy?: keyof T | 'timestamp'; order?: 'asc' | 'desc' }
  ): void {
    const key = this.getCacheKey(options);
    
    // LRU: if cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      result,
      timestamp: this.registryVersion,
    });
  }

  /**
   * Invalidate cache (call when registry changes)
   */
  invalidate(): void {
    this.registryVersion++;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.registryVersion = 0;
  }
}

// ==========================================
// CORE DESK CREATION
// ==========================================

/**
 * Creates a check-in desk core with optimized performance.
 * 
 * Performance optimizations:
 * - Hybrid registry: Map + shallowRef list (O(1) updates)
 * - Sorted registry cache (LRU, invalidates only on relevant changes)
 * - Event batching (prevents event avalanche)
 * - Plugin lifecycle management (proper cleanup)
 */
export const createDeskCore = <T = any>(options?: DeskCoreOptions<T>): DeskCore<T> => {
  const debug = options?.debug ? Debug : NoOpDebug;

  // ==========================================
  // HYBRID REGISTRY REPRESENTATION
  // ==========================================
  
  /**
   * Primary storage: Map (fast lookups, O(1) operations)
   */
  const registryMap = new Map<string | number, CheckInItem<T>>();
  
  /**
   * Reactive list: shallowRef (Vue reactivity, avoids deep tracking)
   * Only updated when registry changes, not on every access
   */
  const registryList = shallowRef<CheckInItem<T>[]>([]);
  
  /**
   * Synchronize list with map (O(1) amortized cost)
   * Only creates new array when registry actually changes
   */
  const syncList = () => {
    registryList.value = Array.from(registryMap.values());
  };

  // ==========================================
  // EVENT SYSTEM
  // ==========================================
  
  const eventListeners = new Map<DeskEventType, Set<DeskEventCallback<T>>>();
  const eventBatcher = new EventBatcher<T>(eventListeners);

  const on = (event: DeskEventType, callback: DeskEventCallback<T>) => {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(callback);

    debug(`Listener added for '${event}', total: ${eventListeners.get(event)!.size}`);

    // Return unsubscribe function
    return () => off(event, callback);
  };

  const off = (event: DeskEventType, callback: DeskEventCallback<T>) => {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      debug(`Listener removed for '${event}', remaining: ${listeners.size}`);
    }
  };

  const emit = (event: DeskEventType, payload: { id?: string | number; data?: T }) => {
    // Use batching for update events (high frequency)
    if (event === 'update') {
      eventBatcher.add(event, payload);
    } else {
      // Emit immediately for check-in/check-out/clear (lower frequency, more critical)
      eventBatcher.emitImmediate(event, {
        ...payload,
        timestamp: Date.now(),
      });
    }
  };

  // ==========================================
  // SORTED REGISTRY CACHE
  // ==========================================
  
  const sortCache = new SortedRegistryCache<T>();
  
  /**
   * Computed sorted registry (stable, cached)
   */
  const sortedRegistry = computed(() => {
    return Array.from(registryMap.values()).sort((a, b) => {
      const aTime = a.timestamp || 0;
      const bTime = b.timestamp || 0;
      return aTime - bTime;
    });
  });

  // ==========================================
  // PLUGIN SYSTEM
  // ==========================================
  
  const pluginCleanups: Array<() => void> = [];

  // ==========================================
  // CORE OPERATIONS
  // ==========================================

  const checkIn = (id: string | number, data: T, meta?: Record<string, any>): boolean => {
    debug('checkIn', { id, data, meta });

    // Lifecycle: before (plugins first, then user hook)
    if (options?.plugins) {
      for (const plugin of options.plugins) {
        if (plugin.onBeforeCheckIn) {
          const result = plugin.onBeforeCheckIn(id, data);
          if (result === false) {
            debug('checkIn cancelled by plugin:', plugin.name);
            return false;
          }
        }
      }
    }

    if (options?.onBeforeCheckIn) {
      const result = options.onBeforeCheckIn(id, data);
      if (result === false) {
        debug('checkIn cancelled by onBeforeCheckIn', id);
        return false;
      }
    }

    // Update registry (O(1))
    registryMap.set(id, {
      id,
      data,
      timestamp: Date.now(),
      meta,
    });
    
    // Sync list (O(N) but only once per batch of changes)
    syncList();
    
    // Invalidate sort cache
    sortCache.invalidate();

    // Emit event
    emit('check-in', { id, data });

    // Lifecycle: after
    options?.onCheckIn?.(id, data);

    if (options?.debug) {
      debug('Registry state after check-in:', {
        total: registryMap.size,
        items: Array.from(registryMap.keys()),
      });
    }

    return true;
  };

  const checkOut = (id: string | number): boolean => {
    debug('checkOut', id);

    const existed = registryMap.has(id);
    if (!existed) return false;

    // Lifecycle: before (plugins first, then user hook)
    if (options?.plugins) {
      for (const plugin of options.plugins) {
        if (plugin.onBeforeCheckOut) {
          const result = plugin.onBeforeCheckOut(id);
          if (result === false) {
            debug('checkOut cancelled by plugin:', plugin.name);
            return false;
          }
        }
      }
    }

    if (options?.onBeforeCheckOut) {
      const result = options.onBeforeCheckOut(id);
      if (result === false) {
        debug('checkOut cancelled by onBeforeCheckOut', id);
        return false;
      }
    }

    // Update registry (O(1))
    registryMap.delete(id);
    
    // Sync list
    syncList();
    
    // Invalidate sort cache
    sortCache.invalidate();

    // Emit event
    emit('check-out', { id });

    // Lifecycle: after
    options?.onCheckOut?.(id);

    if (options?.debug) {
      debug('Registry state after check-out:', {
        total: registryMap.size,
        items: Array.from(registryMap.keys()),
      });
    }

    return true;
  };

  const get = (id: string | number) => registryMap.get(id);

  const getAll = (sortOptions?: { sortBy?: keyof T | 'timestamp'; order?: 'asc' | 'desc' }) => {
    // Check cache first
    const cached = sortCache.get(sortOptions);
    if (cached) {
      debug('Returning cached sorted result');
      return cached;
    }

    // No sort requested, return list as-is
    if (!sortOptions?.sortBy) {
      const result = registryList.value.slice();
      sortCache.set(result, sortOptions);
      return result;
    }

    // Perform sort
    const items = Array.from(registryMap.values());
    const sorted = items.sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortOptions.sortBy === 'timestamp') {
        aVal = a.timestamp || 0;
        bVal = b.timestamp || 0;
      } else {
        const key = sortOptions.sortBy as keyof T;
        aVal = a.data[key];
        bVal = b.data[key];
      }

      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOptions.order === 'desc' ? -comparison : comparison;
    });

    // Cache result
    sortCache.set(sorted, sortOptions);

    return sorted;
  };

  const update = (id: string | number, data: Partial<T>): boolean => {
    const existing = registryMap.get(id);
    if (!existing) {
      debug('update failed: item not found', id);
      return false;
    }

    if (typeof existing.data === 'object' && typeof data === 'object') {
      const previousData = { ...existing.data };

      // Direct update (mutation is fine since we control the Map)
      Object.assign(existing.data as object, data);
      
      // Sync list (triggers reactivity)
      syncList();
      
      // Invalidate sort cache only if sorted fields might have changed
      sortCache.invalidate();

      // Emit event (will be batched)
      emit('update', { id, data: existing.data });

      if (options?.debug) {
        debug('update diff:', {
          id,
          before: previousData,
          after: existing.data,
          changes: data,
        });
      }

      return true;
    }

    return false;
  };

  const has = (id: string | number) => registryMap.has(id);

  const clear = () => {
    debug('clear');
    const count = registryMap.size;
    
    registryMap.clear();
    syncList();
    sortCache.clear();

    // Emit event
    emit('clear', {});

    // Cleanup plugins
    pluginCleanups.forEach((cleanup) => cleanup());
    pluginCleanups.length = 0;

    debug(`Cleared ${count} items from registry`);
  };

  const checkInMany = (
    items: Array<{ id: string | number; data: T; meta?: Record<string, any> }>
  ) => {
    debug('checkInMany', items.length, 'items');
    items.forEach(({ id, data, meta }) => checkIn(id, data, meta));
  };

  const checkOutMany = (ids: Array<string | number>) => {
    debug('checkOutMany', ids.length, 'items');
    ids.forEach((id) => checkOut(id));
  };

  const updateMany = (updates: Array<{ id: string | number; data: Partial<T> }>) => {
    debug('updateMany', updates.length, 'items');
    updates.forEach(({ id, data }) => update(id, data));
  };

  // ==========================================
  // ASSEMBLE DESK CORE
  // ==========================================

  const desk: DeskCore<T> = {
    registryMap,
    registryList,
    sortedRegistry,
    checkIn,
    checkOut,
    get,
    getAll,
    update,
    has,
    clear,
    checkInMany,
    checkOutMany,
    updateMany,
    on,
    off,
    emit,
  };

  // ==========================================
  // APPLY PLUGINS
  // ==========================================

  if (options?.plugins) {
    options.plugins.forEach((plugin) => {
      debug('Installing plugin:', plugin.name);

      // 1. Install plugin
      if (plugin.install) {
        const cleanup = plugin.install(desk as any);
        if (cleanup) {
          pluginCleanups.push(cleanup);
        }
      }

      // 2. Hook events via event system
      if (plugin.onCheckIn) {
        desk.on('check-in', ({ id, data }) => {
          plugin.onCheckIn!(id!, data!);
        });
      }

      if (plugin.onCheckOut) {
        desk.on('check-out', ({ id }) => {
          plugin.onCheckOut!(id!);
        });
      }

      // 3. Add custom methods
      if (plugin.methods) {
        Object.entries(plugin.methods).forEach(([name, method]) => {
          (desk as any)[name] = (...args: any[]) => method(desk as any, ...args);
        });
      }

      // 4. Add computed properties
      if (plugin.computed) {
        Object.entries(plugin.computed).forEach(([name, getter]) => {
          Object.defineProperty(desk, name, {
            get: () => getter(desk as any),
            enumerable: true,
            configurable: true,
          });
        });
      }
    });
  }

  return desk;
};
