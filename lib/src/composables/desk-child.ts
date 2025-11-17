/**
 * Child component check-in functionality.
 * Handles component registration, data watching, and async update protection.
 */

import {
  ref,
  inject,
  onUnmounted,
  watch,
  type InjectionKey,
  type Ref,
} from 'vue';
import type { DeskCore } from './desk-core';

// ==========================================
// TYPES
// ==========================================

export interface CheckInOptions<T = any> {
  required?: boolean;
  autoCheckIn?: boolean;
  id?: string | number;
  data?: T | (() => T) | (() => Promise<T>);
  generateId?: () => string | number;
  watchData?: boolean;
  shallow?: boolean;
  watchCondition?: (() => boolean) | Ref<boolean>;
  meta?: Record<string, any>;
  debug?: boolean;
}

// ==========================================
// DEBUG HELPERS
// ==========================================

const NoOpDebug = (_message: string, ..._args: any[]) => {};
const Debug = (message: string, ...args: any[]) => {
  console.log(`[DeskChild] ${message}`, ...args);
};

// ==========================================
// ASYNC UPDATE PROTECTION
// ==========================================

/**
 * Protects against race conditions in async data updates.
 * Ensures that only the latest async operation's result is applied.
 * 
 * Example scenario:
 * 1. User triggers update A (slow API call)
 * 2. User triggers update B (fast API call)
 * 3. B completes first, updates state
 * 4. A completes second → should be IGNORED (stale)
 * 
 * Without protection: A would overwrite B's newer data
 * With protection: A is detected as stale and discarded
 */
class AsyncUpdateGuard {
  private updateCounter = 0;

  /**
   * Start a new async operation and get its token
   */
  startUpdate(): number {
    return ++this.updateCounter;
  }

  /**
   * Check if an update token is still current
   */
  isCurrentUpdate(token: number): boolean {
    return token === this.updateCounter;
  }

  /**
   * Reset counter (useful for cleanup)
   */
  reset(): void {
    this.updateCounter = 0;
  }
}

// ==========================================
// CHILD CHECK-IN
// ==========================================

export interface CheckInResult<T = any, TContext extends Record<string, any> = {}> {
  desk: (DeskCore<T> & TContext) | null;
  checkOut: () => void;
  updateSelf: (newData?: T) => Promise<void>;
}

/**
 * Checks in to a desk (child component registers itself).
 * 
 * Performance features:
 * - Async update protection (race condition prevention)
 * - Efficient watchers (only when needed)
 * - Automatic cleanup on unmount
 * 
 * @param parentDeskOrKey - The desk to check in to (object, symbol, or string)
 * @param checkInOptions - Check-in configuration
 */
export const checkInToDesk = <
  T = any,
  TContext extends Record<string, any> = {},
>(
  parentDeskOrKey:
    | (DeskCore<T> & TContext)
    | InjectionKey<DeskCore<T> & TContext>
    | string
    | null
    | undefined,
  checkInOptions?: CheckInOptions<T>
): CheckInResult<T, TContext> => {
  const debug = checkInOptions?.debug ? Debug : NoOpDebug;

  // Auto-handle null/undefined context - no need for ternary pattern
  if (!parentDeskOrKey) {
    debug('No parent desk provided - skipping check-in');

    return {
      desk: null,
      checkOut: () => {},
      updateSelf: async () => {},
    };
  }

  // Inject the desk if a symbol or string key is provided
  let desk: (DeskCore<T> & TContext) | null | undefined;

  if (typeof parentDeskOrKey === 'symbol') {
    desk = inject(parentDeskOrKey);
    if (!desk) {
      debug('Could not inject desk from symbol');

      return {
        desk: null,
        checkOut: () => {},
        updateSelf: async () => {},
      };
    }
  } else if (typeof parentDeskOrKey === 'string') {
    // Inject le Symbol depuis la clé string
    const injectionKey = inject<InjectionKey<DeskCore<T> & TContext>>(parentDeskOrKey);
    if (!injectionKey) {
      debug('Could not find desk with key:', parentDeskOrKey);

      return {
        desk: null,
        checkOut: () => {},
        updateSelf: async () => {},
      };
    }
    desk = inject(injectionKey);
    if (!desk) {
      debug('Could not inject desk from key:', parentDeskOrKey);

      return {
        desk: null,
        checkOut: () => {},
        updateSelf: async () => {},
      };
    }
  } else {
    desk = parentDeskOrKey;
  }

  const itemId = checkInOptions?.id || `item-${Date.now()}-${Math.random()}`;
  const isCheckedIn = ref(false);
  let conditionStopHandle: (() => void) | null = null;
  let watchStopHandle: (() => void) | null = null;

  // ==========================================
  // ASYNC UPDATE PROTECTION
  // ==========================================
  
  const asyncGuard = new AsyncUpdateGuard();

  // ==========================================
  // DATA HELPERS
  // ==========================================

  /**
   * Get current data value (sync or async, with race condition protection)
   */
  const getCurrentData = async (): Promise<T> => {
    if (!checkInOptions?.data) return undefined as T;

    const dataValue =
      typeof checkInOptions.data === 'function'
        ? (checkInOptions.data as (() => T) | (() => Promise<T>))()
        : checkInOptions.data;

    // If it's a Promise, protect against race conditions
    if (dataValue instanceof Promise) {
      const updateToken = asyncGuard.startUpdate();
      
      try {
        const resolved = await dataValue;
        
        // Check if this update is still current
        if (!asyncGuard.isCurrentUpdate(updateToken)) {
          debug(`Async data resolved but is stale (newer update in progress) - discarding`);
          return undefined as T; // Return undefined to signal staleness
        }
        
        return resolved;
      } catch (error) {
        debug('Async data fetch failed:', error);
        throw error;
      }
    }

    return dataValue;
  };

  // ==========================================
  // CHECK-IN/OUT OPERATIONS
  // ==========================================

  /**
   * Perform the actual check-in
   */
  const performCheckIn = async (): Promise<boolean> => {
    if (isCheckedIn.value) return true;

    const data = await getCurrentData();
    
    // If data is undefined, it might be stale - skip check-in
    if (data === undefined && checkInOptions?.data !== undefined) {
      debug(`Skipping check-in - async data was stale`);
      return false;
    }

    const success = desk!.checkIn(itemId, data, checkInOptions?.meta);

    if (success) {
      isCheckedIn.value = true;
      debug(`Checked in: ${itemId}`, data);
    } else {
      debug(`Check-in cancelled for: ${itemId}`);
    }

    return success;
  };

  /**
   * Perform check-out
   */
  const performCheckOut = () => {
    if (!isCheckedIn.value) return;

    desk!.checkOut(itemId);
    isCheckedIn.value = false;

    debug(`Checked out: ${itemId}`);
  };

  // ==========================================
  // CONDITION WATCHING
  // ==========================================

  // Setup watchCondition if provided
  if (checkInOptions?.watchCondition) {
    const condition = checkInOptions.watchCondition;

    // Immediate check
    const shouldBeCheckedIn = typeof condition === 'function' ? condition() : condition.value;
    if (shouldBeCheckedIn && checkInOptions?.autoCheckIn !== false) {
      performCheckIn();
    }

    // Watch for changes
    conditionStopHandle = watch(
      () => (typeof condition === 'function' ? condition() : condition.value),
      async (shouldCheckIn) => {
        if (shouldCheckIn && !isCheckedIn.value) {
          await performCheckIn();
        } else if (!shouldCheckIn && isCheckedIn.value) {
          performCheckOut();
        }
      }
    );
  }
  // Normal auto check-in (if no condition)
  else if (checkInOptions?.autoCheckIn !== false) {
    performCheckIn();
  }

  // ==========================================
  // DATA WATCHING
  // ==========================================

  // Setup watchData if provided
  if (checkInOptions?.watchData && checkInOptions?.data) {
    const watchOptions = checkInOptions.shallow ? { deep: false } : { deep: true };

    watchStopHandle = watch(
      () => {
        if (!checkInOptions.data) return undefined;
        return typeof checkInOptions.data === 'function'
          ? (checkInOptions.data as (() => T) | (() => Promise<T>))()
          : checkInOptions.data;
      },
      async (newData) => {
        if (isCheckedIn.value && newData !== undefined) {
          // Start async guard
          const updateToken = asyncGuard.startUpdate();
          
          const resolvedData = newData instanceof Promise ? await newData : newData;
          
          // Check if still current
          if (!asyncGuard.isCurrentUpdate(updateToken)) {
            debug(`Data update stale - newer update in progress`);
            return;
          }
          
          desk!.update(itemId, resolvedData);
          debug(`Updated data for: ${itemId}`, resolvedData);
        }
      },
      watchOptions
    );
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  // Cleanup on unmount
  onUnmounted(() => {
    performCheckOut();

    if (watchStopHandle) {
      watchStopHandle();
    }

    if (conditionStopHandle) {
      conditionStopHandle();
    }
    
    // Reset async guard
    asyncGuard.reset();
  });

  // ==========================================
  // RETURN API
  // ==========================================

  return {
    desk,
    checkOut: performCheckOut,
    updateSelf: async (newData?: T) => {
      if (!isCheckedIn.value) return;

      const updateToken = asyncGuard.startUpdate();
      const data = newData !== undefined ? newData : await getCurrentData();
      
      // Check if still current
      if (!asyncGuard.isCurrentUpdate(updateToken)) {
        debug(`Manual update stale - newer update in progress`);
        return;
      }
      
      // Skip if data is undefined and was expected to have a value
      if (data === undefined && checkInOptions?.data !== undefined && newData === undefined) {
        debug(`Skipping update - async data was stale`);
        return;
      }

      desk!.update(itemId, data);
      debug(`Manual update for: ${itemId}`, data);
    },
  };
};
