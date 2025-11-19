import type { CheckInPlugin } from 'vue-airport';

export interface DebounceOptions {
  /** Debounce delay in milliseconds for check-in operations */
  checkInDelay?: number;

  /** Debounce delay in milliseconds for check-out operations */
  checkOutDelay?: number;

  /** Maximum time the function can be delayed before it's invoked */
  maxWait?: number;

  /** If true, debounce the actual check-in/check-out operations, not just notifications */
  debounceOperations?: boolean;
}

/**
 * Plugin to debounce event notifications from check-in/check-out operations.
 * The operations themselves are not delayed, only the onCheckIn/onCheckOut hooks.
 * Useful for scenarios where you want to batch event notifications.
 *
 * @example
 * ```ts
 * const { desk } = createDesk('search-results', {
 *   plugins: [
 *     createDebouncePlugin({
 *       checkInDelay: 300
 *     })
 *   ]
 * });
 * ```
 */
export const createDebouncePlugin = <T = unknown>(
  options: DebounceOptions = {}
): CheckInPlugin<T> => {
  const { checkInDelay = 300, checkOutDelay = 300, maxWait } = options;

  let checkInTimer: ReturnType<typeof setTimeout> | null = null;
  let checkOutTimer: ReturnType<typeof setTimeout> | null = null;
  const pendingCheckInEvents = new Map<string | number, T>();
  const pendingCheckOutEvents = new Set<string | number>();
  let firstCheckInTime: number | null = null;
  let firstCheckOutTime: number | null = null;
  let userCheckInCallback: ((id: string | number, data: T) => void) | null = null;
  let userCheckOutCallback: ((id: string | number) => void) | null = null;

  const clearCheckInTimer = () => {
    if (checkInTimer) {
      clearTimeout(checkInTimer);
      checkInTimer = null;
    }
  };

  const clearCheckOutTimer = () => {
    if (checkOutTimer) {
      clearTimeout(checkOutTimer);
      checkOutTimer = null;
    }
  };

  const shouldInvokeByMaxWait = (firstTime: number | null): boolean => {
    if (!maxWait || !firstTime) return false;
    return Date.now() - firstTime >= maxWait;
  };

  const processCheckInNotifications = (desk?: any) => {
    if (pendingCheckInEvents.size === 0) return;

    const events = Array.from(pendingCheckInEvents.entries());
    const count = events.length;
    pendingCheckInEvents.clear();
    firstCheckInTime = null;
    clearCheckInTimer();

    // Notify about all pending check-ins
    if (userCheckInCallback) {
      events.forEach(([id, data]) => {
        userCheckInCallback!(id, data);
      });
    }

    // Track in DevTools
    if (desk?.__deskId) {
      desk.devTools.emit({
        type: 'plugin-execute',
        timestamp: Date.now(),
        deskId: desk.__deskId,
        pluginName: 'debounce',
        duration: 0,
        data: {
          action: 'processCheckInNotifications',
          count,
        },
      });
    }
  };

  const processCheckOutNotifications = (desk?: any) => {
    if (pendingCheckOutEvents.size === 0) return;

    const ids = Array.from(pendingCheckOutEvents);
    const count = ids.length;
    pendingCheckOutEvents.clear();
    firstCheckOutTime = null;
    clearCheckOutTimer();

    // Notify about all pending check-outs
    if (userCheckOutCallback) {
      ids.forEach((id) => {
        userCheckOutCallback!(id);
      });
    }

    // Track in DevTools
    if (desk?.__deskId) {
      desk.devTools.emit({
        type: 'plugin-execute',
        timestamp: Date.now(),
        deskId: desk.__deskId,
        pluginName: 'debounce',
        duration: 0,
        data: {
          action: 'processCheckOutNotifications',
          count,
        },
      });
    }
  };

  let deskInstance: any = null;

  return {
    name: 'debounce',
    version: '1.0.0',

    install: (desk) => {
      deskInstance = desk;
      return () => {
        clearCheckInTimer();
        clearCheckOutTimer();
        pendingCheckInEvents.clear();
        pendingCheckOutEvents.clear();
        firstCheckInTime = null;
        firstCheckOutTime = null;
        userCheckInCallback = null;
        userCheckOutCallback = null;
        deskInstance = null;
      };
    },

    dispose: () => {
      clearCheckInTimer();
      clearCheckOutTimer();
      pendingCheckInEvents.clear();
      pendingCheckOutEvents.clear();
    },

    onCheckIn: (id: string | number, data: T) => {
      const now = Date.now();

      // Track first operation time
      if (!firstCheckInTime) {
        firstCheckInTime = now;
      }

      // Store the event (will override previous value for same id)
      pendingCheckInEvents.set(id, data);

      // Clear existing timer
      clearCheckInTimer();

      // Check if we should invoke by maxWait
      if (shouldInvokeByMaxWait(firstCheckInTime)) {
        processCheckInNotifications(deskInstance);
        return;
      }

      // Set new timer
      checkInTimer = setTimeout(() => {
        processCheckInNotifications(deskInstance);
      }, checkInDelay);
    },

    onCheckOut: (id: string | number) => {
      const now = Date.now();

      // Track first operation time
      if (!firstCheckOutTime) {
        firstCheckOutTime = now;
      }

      // Store the event
      pendingCheckOutEvents.add(id);

      // Clear existing timer
      clearCheckOutTimer();

      // Check if we should invoke by maxWait
      if (shouldInvokeByMaxWait(firstCheckOutTime)) {
        processCheckOutNotifications(deskInstance);
        return;
      }

      // Set new timer
      checkOutTimer = setTimeout(() => {
        processCheckOutNotifications(deskInstance);
      }, checkOutDelay);
    },

    methods: {
      /**
       * Immediately flush all pending debounced event notifications
       */
      flushDebounce: (desk: any) => {
        const startTime = performance.now();
        const deskId = desk?.__deskId;
        const checkInCount = pendingCheckInEvents.size;
        const checkOutCount = pendingCheckOutEvents.size;

        processCheckInNotifications(desk);
        processCheckOutNotifications(desk);

        // Track in DevTools
        const duration = performance.now() - startTime;
        if (deskId) {
          desk.devTools.emit({
            type: 'plugin-execute',
            timestamp: Date.now(),
            deskId,
            pluginName: 'debounce',
            duration,
            data: {
              action: 'flushDebounce',
              checkInCount,
              checkOutCount,
            },
          });
        }
      },

      /**
       * Cancel all pending debounced event notifications
       */
      cancelDebounce: (desk: any) => {
        const startTime = performance.now();
        const deskId = desk?.__deskId;
        const checkInCount = pendingCheckInEvents.size;
        const checkOutCount = pendingCheckOutEvents.size;

        clearCheckInTimer();
        clearCheckOutTimer();
        pendingCheckInEvents.clear();
        pendingCheckOutEvents.clear();
        firstCheckInTime = null;
        firstCheckOutTime = null;

        // Track in DevTools
        const duration = performance.now() - startTime;
        if (deskId) {
          desk.devTools.emit({
            type: 'plugin-execute',
            timestamp: Date.now(),
            deskId,
            pluginName: 'debounce',
            duration,
            data: {
              action: 'cancelDebounce',
              cancelledCheckInCount: checkInCount,
              cancelledCheckOutCount: checkOutCount,
            },
          });
        }
      },

      /**
       * Set callback to be notified about debounced check-in events
       */
      onDebouncedCheckIn: (_desk: any, callback: (id: string | number, data: T) => void) => {
        userCheckInCallback = callback;
      },

      /**
       * Set callback to be notified about debounced check-out events
       */
      onDebouncedCheckOut: (_desk: any, callback: (id: string | number) => void) => {
        userCheckOutCallback = callback;
      },
    },

    computed: {
      /**
       * Get the number of pending debounced check-in events
       */
      pendingCheckInsCount: () => pendingCheckInEvents.size,

      /**
       * Get the number of pending debounced check-out events
       */
      pendingCheckOutsCount: () => pendingCheckOutEvents.size,

      /**
       * Check if there are any pending event notifications
       */
      hasPendingDebounce: () => pendingCheckInEvents.size > 0 || pendingCheckOutEvents.size > 0,
    },
  };
};
