/**
 * Child component check-in functionality.
 * Handles component registration, data watching, and async update protection.
 */

import { ref, inject, onUnmounted, watch, type InjectionKey, type Ref } from 'vue';
import type { DeskCore } from '../desk/desk-core';
import { AsyncUpdateGuard } from '../helpers/async-update-guard';
import { NoOp, Debug } from '../utils';

export interface CheckInOptions<T = any, TContext extends Record<string, any> = {}> {
  required?: boolean;
  autoCheckIn?: boolean;
  id?: string | number;
  data?:
    | T
    | (() => T)
    | (() => Promise<T>)
    | ((desk: DeskCore<T> & TContext) => T)
    | ((desk: DeskCore<T> & TContext) => Promise<T>)
    | ((desk: DeskCore<T> & TContext, id: string | number) => T)
    | ((desk: DeskCore<T> & TContext, id: string | number) => Promise<T>);
  generateId?: () => string | number;
  watchData?: boolean;
  shallow?: boolean;
  watchCondition?: ((desk: DeskCore<T> & TContext) => boolean) | Ref<boolean>;
  meta?: Record<string, any>;
  debug?: boolean;
}

export interface CheckInResult<T = any, TContext extends Record<string, any> = {}> {
  desk: (DeskCore<T> & TContext) | null;
  checkOut: () => void;
  updateSelf: (newData?: T) => Promise<void>;
}

const DebugPrefix = '[useCheckIn:desk-child]';

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
export const checkInToDesk = <T = any, TContext extends Record<string, any> = {}>(
  parentDeskOrKey:
    | (DeskCore<T> & TContext)
    | InjectionKey<DeskCore<T> & TContext>
    | null
    | undefined,
  checkInOptions?: CheckInOptions<T, TContext>
): CheckInResult<T, TContext> => {
  const debug = checkInOptions?.debug ? Debug : NoOp;

  // Auto-handle null/undefined context - no need for ternary pattern
  if (!parentDeskOrKey) {
    debug(`${DebugPrefix} No parent desk provided - skipping check-in`);

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
      debug(`${DebugPrefix} Could not inject desk with symbol`, String(parentDeskOrKey));
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

  // Async update protection
  const asyncGuard = new AsyncUpdateGuard();

  /**
   * Get current data value (sync or async, with race condition protection)
   */
  const getCurrentData = async (): Promise<T> => {
    if (!checkInOptions?.data) return undefined as T;

    const dataValue =
      typeof checkInOptions.data === 'function'
        ? (
            checkInOptions.data as
              | ((desk: DeskCore<T> & TContext, id: string | number) => T)
              | ((desk: DeskCore<T> & TContext, id: string | number) => Promise<T>)
              | ((desk: DeskCore<T> & TContext) => T)
              | ((desk: DeskCore<T> & TContext) => Promise<T>)
              | (() => T)
              | (() => Promise<T>)
          )(desk!, itemId)
        : checkInOptions.data;

    // If it's a Promise, protect against race conditions
    if (dataValue instanceof Promise) {
      const updateToken = asyncGuard.startUpdate();

      try {
        const resolved = await dataValue;

        // Check if this update is still current
        if (!asyncGuard.isCurrentUpdate(updateToken)) {
          debug(
            `${DebugPrefix} Async data resolved but is stale (newer update in progress) - discarding`
          );
          return undefined as T; // Return undefined to signal staleness
        }

        return resolved;
      } catch (error) {
        debug(`${DebugPrefix} Async data fetch failed:`, error);
        throw error;
      }
    }

    return dataValue;
  };

  /**
   * Perform the actual check-in
   */
  const performCheckIn = async (): Promise<boolean> => {
    if (isCheckedIn.value) return true;

    const data = await getCurrentData();

    // If data is undefined, it might be stale - skip check-in
    if (data === undefined && checkInOptions?.data !== undefined) {
      debug(`${DebugPrefix} Skipping check-in - async data was stale`);
      return false;
    }

    const success = await desk!.checkIn(itemId, data, checkInOptions?.meta);

    if (success) {
      isCheckedIn.value = true;
      debug(`${DebugPrefix} Checked in: ${itemId}`, data);
    } else {
      debug(`${DebugPrefix} Check-in cancelled for: ${itemId}`);
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

    debug(`${DebugPrefix} Checked out: ${itemId}`);
  };

  // Setup watchCondition if provided
  if (checkInOptions?.watchCondition) {
    const condition = checkInOptions.watchCondition;

    // Immediate check
    const shouldBeCheckedIn = typeof condition === 'function' ? condition(desk!) : condition.value;
    if (shouldBeCheckedIn && checkInOptions?.autoCheckIn === true) {
      performCheckIn();
    }

    // Watch for changes
    conditionStopHandle = watch(
      () => (typeof condition === 'function' ? condition(desk!) : condition.value),
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
  else if (checkInOptions?.autoCheckIn === true) {
    performCheckIn();
  }

  // Setup watchData if provided
  if (checkInOptions?.watchData && checkInOptions?.data) {
    const watchOptions = checkInOptions.shallow ? { deep: false } : { deep: true };

    watchStopHandle = watch(
      () => {
        if (!checkInOptions.data) return undefined;
        return typeof checkInOptions.data === 'function'
          ? (
              checkInOptions.data as
                | ((desk: DeskCore<T> & TContext) => T)
                | ((desk: DeskCore<T> & TContext) => Promise<T>)
                | (() => T)
                | (() => Promise<T>)
            )(desk!)
          : checkInOptions.data;
      },
      async (newData) => {
        if (isCheckedIn.value && newData !== undefined) {
          // Start async guard
          const updateToken = asyncGuard.startUpdate();

          const resolvedData = newData instanceof Promise ? await newData : newData;

          // Check if still current
          if (!asyncGuard.isCurrentUpdate(updateToken)) {
            debug(`${DebugPrefix} Data update stale - newer update in progress`);
            return;
          }

          desk!.update(itemId, resolvedData);
          debug(`${DebugPrefix} Updated data for: ${itemId}`, resolvedData);
        }
      },
      watchOptions
    );
  }

  /**
   * Self update
   */
  const updateSelf = async (newData?: T) => {
    if (!isCheckedIn.value) return;

    const updateToken = asyncGuard.startUpdate();
    const data = newData !== undefined ? newData : await getCurrentData();

    // Check if still current
    if (!asyncGuard.isCurrentUpdate(updateToken)) {
      debug(`${DebugPrefix} Manual update stale - newer update in progress`);
      return;
    }

    // Skip if data is undefined and was expected to have a value
    if (data === undefined && checkInOptions?.data !== undefined && newData === undefined) {
      debug(`${DebugPrefix} Skipping update - async data was stale`);
      return;
    }

    desk!.update(itemId, data);
    debug(`${DebugPrefix} Manual update for: ${itemId}`, data);
  };

  // Cleanup on unmount
  onUnmounted(() => {
    debug(`${DebugPrefix} Component unmounted - performing check-out if needed`);
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

  return {
    desk,
    checkOut: performCheckOut,
    updateSelf,
  };
};
