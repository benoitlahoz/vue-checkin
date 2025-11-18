/**
 * VueAirport - Generic check-in system for parent/child component registration.
 */

import { computed, type ComputedRef, type Ref, type InjectionKey } from 'vue';

import {
  createDeskCore,
  type DeskCore,
  type DeskEventType,
  type DeskEventCallback,
  type CheckInItem,
  type DeskCoreOptions,
} from './desk/desk-core';
import { provideDesk, type DeskWithContext } from './desk/desk-injection';
import { checkInToDesk, type CheckInOptions, type CheckInResult } from './desk/desk-child';

// Re-export types
export type { DeskEventType, DeskEventCallback, CheckInItem, CheckInOptions, DeskCore };

// WeakMap for generating stable IDs based on component instance
const instanceIdMap = new WeakMap<object, string>();
// Map for custom IDs provided by user
const customIdMap = new Map<string, string>();
let instanceCounter = 0;

/**
 * Generates a cryptographically secure unique ID.
 * Uses crypto.randomUUID if available, otherwise crypto.getRandomValues.
 * Falls back to timestamp + Math.random for legacy environments.
 */
export const generateId = (prefix = 'item'): string => {
  // Try crypto.randomUUID if available (modern browser + Node 19+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  // Otherwise use crypto.getRandomValues (nearly universal)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const id = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}-${id}`;
  }

  // Ultimate fallback for very old environments
  const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  if (isDev) {
    console.warn(
      '[useCheckIn] crypto API not available, using Math.random fallback. ' +
        'Consider upgrading to a modern environment.'
    );
  }
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generates a memoized ID for a component.
 * Memoizes IDs based on instance or custom ID to ensure stability across remounts.
 */
export const memoizedId = (
  instanceOrId: object | string | number | null | undefined,
  prefix = 'item'
): string => {
  // Case 1: It's a string or number = custom ID provided by user
  if (typeof instanceOrId === 'string' || typeof instanceOrId === 'number') {
    const key = `${prefix}-${instanceOrId}`;
    let id = customIdMap.get(key);
    if (!id) {
      id = String(instanceOrId);
      customIdMap.set(key, id);
    }
    return id;
  }

  // Case 2: It's an object = Vue instance (getCurrentInstance())
  if (instanceOrId && typeof instanceOrId === 'object') {
    let id = instanceIdMap.get(instanceOrId);
    if (!id) {
      id = `${prefix}-${++instanceCounter}`;
      instanceIdMap.set(instanceOrId, id);
    }
    return id;
  }

  // Case 3: null/undefined = cryptographically secure generation with warning
  return generateId(prefix);
};

/**
 * Clears the memoization cache for custom IDs.
 * Useful for cleanup after major route changes or in long-running SPAs.
 * Note: instanceIdMap (WeakMap) is auto-cleaned by garbage collection.
 */
export const clearIdCache = (resetCounter = false) => {
  customIdMap.clear();

  if (resetCounter) {
    instanceCounter = 0;
  }
};

/**
 * Computed helper to check if a specific ID is checked in
 */
export const isCheckedIn = <T = any, TContext extends Record<string, any> = {}>(
  desk: DeskCore<T> & TContext,
  id: string | number | Ref<string | number>
): ComputedRef<boolean> => {
  return computed(() => {
    const itemId = typeof id === 'object' && 'value' in id ? id.value : id;
    return desk.has(itemId);
  });
};

/**
 * Computed helper to get the registry as an array
 */
export const getRegistry = <T = any, TContext extends Record<string, any> = {}>(
  desk: DeskCore<T> & TContext,
  options?: { sortBy?: keyof T | 'timestamp'; order?: 'asc' | 'desc' }
): ComputedRef<CheckInItem<T>[]> => {
  return computed(() => desk.getAll(options));
};

/**
 * Check-in system for managing parent-child component relationships.
 *
 * Architecture:
 * - desk-core.ts: Registry, events, plugins (optimized for performance)
 * - desk-di.ts: Dependency injection (simplified Symbol-based keys)
 * - desk-child.ts: Child check-in logic (async protection, watchers)
 *
 * Performance optimizations:
 * - Hybrid registry (Map + shallowRef) for O(1) updates
 * - LRU cache for sorted results
 * - Event batching (prevents avalanche)
 * - Async update protection (race condition prevention)
 *
 * @example
 * ```ts
 * // In parent component - create a desk
 * const { createDesk } = useCheckIn<TabItem>()
 * const { desk } = createDesk('tabsDesk', {
 *   context: { activeTab: ref('tab1') }
 * })
 *
 * // In child component - check in at parent's desk
 * const { checkIn } = useCheckIn<TabItem>()
 * const { desk } = checkIn('tabsDesk', {
 *   autoCheckIn: true,
 *   id: props.id,
 *   data: () => ({ label: props.label })
 * })
 * ```
 */
export const useCheckIn = <T = any, TContext extends Record<string, any> = {}>() => {
  /**
   * Creates a check-in desk and provides it to children.
   * Uses Symbol-based dependency injection.
   */
  const createDesk = (
    injectionKey: InjectionKey<DeskWithContext<T, TContext>> = Symbol('CheckInDesk'),
    options?: DeskCoreOptions<T> & { context?: TContext }
  ) => {
    // Extract deskId from Symbol description or options
    const deskId = options?.deskId || (injectionKey as any).description || 'desk';

    // Create desk core with deskId
    const deskCore = createDeskCore<T>({ ...options, deskId });

    // Provide to children with context
    const { desk, injectionKey: key } = provideDesk<T, TContext>(
      injectionKey,
      deskCore,
      options?.context,
      options?.debug
    );

    return {
      desk,
      injectionKey: key,
    };
  };

  /**
   * Checks in to a desk (child component registers itself).
   */
  const checkIn = (
    parentDeskOrKey:
      | (DeskCore<T> & TContext)
      | InjectionKey<DeskCore<T> & TContext>
      | string
      | null
      | undefined,
    checkInOptions?: CheckInOptions<T>
  ): CheckInResult<T, TContext> => {
    return checkInToDesk<T, TContext>(parentDeskOrKey as any, checkInOptions);
  };

  /**
   * Creates a standalone desk without injection (for local/testing usage)
   */
  const standaloneDesk = (options?: DeskCoreOptions<T>) => {
    return createDeskCore<T>(options);
  };

  return {
    createDesk,
    checkIn,
    generateId,
    memoizedId,
    standaloneDesk,
    isCheckedIn,
    getRegistry,
    clearIdCache,
  };
};

export {
  createActiveItemPlugin,
  createValidationPlugin,
  createDebouncePlugin,
  createHistoryPlugin,
  type ValidationOptions,
  type DebounceOptions,
  type HistoryOptions,
  type HistoryEntry,
} from '../plugins';

export type { CheckInPlugin } from './types';
