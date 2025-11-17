import type { CheckInPlugin } from '../composables/types';

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
  const {
    checkInDelay = 300,
    checkOutDelay = 300,
    maxWait,
  } = options;

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

  const processCheckInNotifications = () => {
    if (pendingCheckInEvents.size === 0) return;

    const events = Array.from(pendingCheckInEvents.entries());
    pendingCheckInEvents.clear();
    firstCheckInTime = null;
    clearCheckInTimer();

    // Notify about all pending check-ins
    if (userCheckInCallback) {
      events.forEach(([id, data]) => {
        userCheckInCallback!(id, data);
      });
    }
  };

  const processCheckOutNotifications = () => {
    if (pendingCheckOutEvents.size === 0) return;

    const ids = Array.from(pendingCheckOutEvents);
    pendingCheckOutEvents.clear();
    firstCheckOutTime = null;
    clearCheckOutTimer();

    // Notify about all pending check-outs
    if (userCheckOutCallback) {
      ids.forEach((id) => {
        userCheckOutCallback!(id);
      });
    }
  };

  return {
    name: 'debounce',
    version: '1.0.0',

    install: (_desk) => {
      return () => {
        clearCheckInTimer();
        clearCheckOutTimer();
        pendingCheckInEvents.clear();
        pendingCheckOutEvents.clear();
        firstCheckInTime = null;
        firstCheckOutTime = null;
        userCheckInCallback = null;
        userCheckOutCallback = null;
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
        processCheckInNotifications();
        return;
      }

      // Set new timer
      checkInTimer = setTimeout(() => {
        processCheckInNotifications();
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
        processCheckOutNotifications();
        return;
      }

      // Set new timer
      checkOutTimer = setTimeout(() => {
        processCheckOutNotifications();
      }, checkOutDelay);
    },

    methods: {
      /**
       * Immediately flush all pending debounced event notifications
       */
      flushDebounce: () => {
        processCheckInNotifications();
        processCheckOutNotifications();
      },

      /**
       * Cancel all pending debounced event notifications
       */
      cancelDebounce: () => {
        clearCheckInTimer();
        clearCheckOutTimer();
        pendingCheckInEvents.clear();
        pendingCheckOutEvents.clear();
        firstCheckInTime = null;
        firstCheckOutTime = null;
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
