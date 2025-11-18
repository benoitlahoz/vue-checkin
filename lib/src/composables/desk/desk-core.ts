/**
 * Core functionality for check-in desk: registry, events, and plugins.
 * Optimized for performance with hybrid registry representation.
 */

import { shallowRef, computed, type ComputedRef, type ShallowRef } from 'vue';
import { EventManager } from '../helpers/event-manager';
import { SortedRegistryCache } from '../helpers/sorted-registry-cache';
import { emitDevToolsEvent, updateDevToolsRegistry } from '../helpers/devtools';
import type { CheckInPlugin } from '../types';
import { NoOp, Debug } from '../utils';

/**
 * Types of events emitted by the desk
 */
export type DeskEventType = 'check-in' | 'check-out' | 'update' | 'clear';

/**
 * Callback signature for desk events
 */
export type DeskEventCallback<T = any> = (payload: {
  id?: string | number;
  data?: T;
  timestamp: number;
}) => void;

/**
 * Represents an item checked into the desk
 */
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
  deskId?: string; // For DevTools integration
}

export interface DeskCore<T = any> {
  /**
   * Internal Map registry - DO NOT use directly in templates.
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

  /**
   * Reactive count of items in the registry
   */
  readonly size: ComputedRef<number>;

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

const DebugPrefix = '[DeskCore]';

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
  const debug = options?.debug ? Debug : NoOp;
  const deskId = options?.deskId || `desk-${Math.random().toString(36).substr(2, 9)}`;

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

  const eventManager = new EventManager<T>({ debug: options?.debug });
  const { on, off, emit } = {
    on: eventManager.on.bind(eventManager),
    off: eventManager.off.bind(eventManager),
    emit: eventManager.emit.bind(eventManager),
  };

  // Sorted registry cache
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

  /**
   * Reactive size/count of items in the registry
   */
  const size = computed(() => registryList.value.length);

  const pluginCleanups: Array<() => void> = [];

  const checkIn = (id: string | number, data: T, meta?: Record<string, any>): boolean => {
    debug(`${DebugPrefix} checkIn`, { id, data, meta });

    // Lifecycle: before (plugins first, then user hook)
    if (options?.plugins) {
      for (const plugin of options.plugins) {
        if (plugin.onBeforeCheckIn) {
          const result = plugin.onBeforeCheckIn(id, data);
          if (result === false) {
            debug(`${DebugPrefix} checkIn cancelled by plugin:`, plugin.name);
            return false;
          }
        }
      }
    }

    if (options?.onBeforeCheckIn) {
      const result = options.onBeforeCheckIn(id, data);
      if (result === false) {
        debug(`${DebugPrefix} checkIn cancelled by onBeforeCheckIn`, id);
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

    // DevTools integration
    emitDevToolsEvent({
      type: 'check-in',
      timestamp: Date.now(),
      deskId,
      childId: id,
      data: meta,
    });
    updateDevToolsRegistry(deskId, registryMap);

    // Lifecycle: after
    options?.onCheckIn?.(id, data);

    if (options?.debug) {
      debug(`${DebugPrefix} Registry state after check-in:`, {
        total: registryMap.size,
        items: Array.from(registryMap.keys()),
      });
    }

    return true;
  };

  const checkOut = (id: string | number): boolean => {
    debug(`${DebugPrefix} checkOut`, id);

    const existed = registryMap.has(id);
    if (!existed) return false;

    // Lifecycle: before (plugins first, then user hook)
    if (options?.plugins) {
      for (const plugin of options.plugins) {
        if (plugin.onBeforeCheckOut) {
          const result = plugin.onBeforeCheckOut(id);
          if (result === false) {
            debug(`${DebugPrefix} checkOut cancelled by plugin:`, plugin.name);
            return false;
          }
        }
      }
    }

    if (options?.onBeforeCheckOut) {
      const result = options.onBeforeCheckOut(id);
      if (result === false) {
        debug(`${DebugPrefix} checkOut cancelled by onBeforeCheckOut`, id);
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

    // DevTools integration
    emitDevToolsEvent({
      type: 'check-out',
      timestamp: Date.now(),
      deskId,
      childId: id,
    });
    updateDevToolsRegistry(deskId, registryMap);

    // Lifecycle: after
    options?.onCheckOut?.(id);

    if (options?.debug) {
      debug(`${DebugPrefix} Registry state after check-out:`, {
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
      debug(`${DebugPrefix} Returning cached sorted result`);
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
      debug(`${DebugPrefix} update failed: item not found`, id);
      return false;
    }

    // Call onBeforeUpdate hooks
    if (options?.plugins) {
      for (const plugin of options.plugins) {
        if (plugin.onBeforeUpdate) {
          const result = plugin.onBeforeUpdate(id, data);
          if (result === false) {
            debug(`${DebugPrefix} update cancelled by plugin:`, plugin.name);
            return false;
          }
        }
      }
    }

    if (typeof existing.data === 'object' && typeof data === 'object') {
      const previousData = { ...existing.data };

      // Direct update (mutation is fine since we control the Map)
      Object.assign(existing.data as object, data);

      // Sync list (triggers reactivity)
      syncList();

      // Invalidate sort cache only if sorted fields might have changed
      sortCache.invalidate();

      // Call onUpdate hooks
      if (options?.plugins) {
        for (const plugin of options.plugins) {
          if (plugin.onUpdate) {
            plugin.onUpdate(id, existing.data);
          }
        }
      }

      // Emit event (will be batched)
      emit('update', { id, data: existing.data });

      // DevTools integration
      emitDevToolsEvent({
        type: 'update',
        timestamp: Date.now(),
        deskId,
        childId: id,
        data: data as Record<string, unknown>,
      });
      updateDevToolsRegistry(deskId, registryMap);

      if (options?.debug) {
        debug(`${DebugPrefix} update diff:`, {
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
    debug(`${DebugPrefix} clear`);
    const count = registryMap.size;

    registryMap.clear();
    syncList();
    sortCache.clear();

    // Emit event
    emit('clear', {});

    // DevTools integration
    emitDevToolsEvent({
      type: 'clear',
      timestamp: Date.now(),
      deskId,
    });
    updateDevToolsRegistry(deskId, registryMap);

    // Cleanup plugins
    pluginCleanups.forEach((cleanup) => cleanup());
    pluginCleanups.length = 0;

    debug(`${DebugPrefix} Cleared ${count} items from registry`);
  };

  const checkInMany = (
    items: Array<{ id: string | number; data: T; meta?: Record<string, any> }>
  ) => {
    debug(`${DebugPrefix} checkInMany`, items.length, 'items');
    items.forEach(({ id, data, meta }) => checkIn(id, data, meta));
  };

  const checkOutMany = (ids: Array<string | number>) => {
    debug(`${DebugPrefix} checkOutMany`, ids.length, 'items');
    ids.forEach((id) => checkOut(id));
  };

  const updateMany = (updates: Array<{ id: string | number; data: Partial<T> }>) => {
    debug(`${DebugPrefix} updateMany`, updates.length, 'items');
    updates.forEach(({ id, data }) => update(id, data));
  };

  const desk: DeskCore<T> = {
    registryMap,
    registryList,
    sortedRegistry,
    size,
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

  if (options?.plugins) {
    options.plugins.forEach((plugin) => {
      debug(`${DebugPrefix} Installing plugin:`, plugin.name);
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
