import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { CheckInPlugin, DeskCore } from 'vue-airport';

export interface DebouncePluginMethods<T> {
  /**
   * Immediately flush all pending debounced event notifications.
   * @param desk The desk instance.
   */
  flushDebounce(desk: DeskCore<T>): void;

  /**
   * Cancel all pending debounced event notifications.
   * @param desk The desk instance.
   */
  cancelDebounce(desk: DeskCore<T>): void;

  /**
   * Set callback to be notified about debounced check-in events.
   * @param _desk The desk instance (unused).
   * @param callback Function called with item id and data when debounced check-in occurs.
   */
  onDebouncedCheckIn(_desk: DeskCore<T>, callback: (id: string | number, data: T) => void): void;

  /**
   * Set callback to be notified about debounced check-out events.
   * @param _desk The desk instance (unused).
   * @param callback Function called with item id when debounced check-out occurs.
   */
  onDebouncedCheckOut(_desk: DeskCore<T>, callback: (id: string | number) => void): void;
}

export interface DebouncePluginComputed<T> {
  /**
   * Reactive ref for the number of pending check-ins.
   */
  pendingCheckInsCount(desk: DeskCore<T>): Ref<number>;

  /**
   * Reactive ref for the number of pending check-outs.
   */
  pendingCheckOutsCount(desk: DeskCore<T>): Ref<number>;

  /**
   * Reactive computed boolean indicating if there are any pending debounced events.
   */
  hasPendingDebounce(desk: DeskCore<T>): ComputedRef<boolean>;
}

/**
 * Interface for the Debounce plugin, extending CheckInPlugin.
 * Provides methods and computed properties for debouncing check-in/check-out events.
 */
export interface DebouncePlugin<T>
  extends CheckInPlugin<T, DebouncePluginMethods<T>, DebouncePluginComputed<T>> {
  methods: DebouncePluginMethods<T>;
  computed: DebouncePluginComputed<T>;
}

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
): DebouncePlugin<T> => {
  const { checkInDelay = 300, checkOutDelay = 300, maxWait } = options;

  let checkInTimer: ReturnType<typeof setTimeout> | null = null;
  let checkOutTimer: ReturnType<typeof setTimeout> | null = null;
  const pendingCheckInEvents = new Map<string | number, T>();
  const pendingCheckOutEvents = new Set<string | number>();
  const pendingCheckInsCountRef = ref(0);
  const pendingCheckOutsCountRef = ref(0);
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
    pendingCheckInsCountRef.value = 0;
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
    pendingCheckOutsCountRef.value = 0;
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

    install: (desk: DeskCore<T>) => {
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

    onCheckIn: (id: string | number, data: T) => {
      const now = Date.now();

      // Track first operation time
      if (!firstCheckInTime) {
        firstCheckInTime = now;
      }

      // Store the event (will override previous value for same id)
      pendingCheckInEvents.set(id, data);
      pendingCheckInsCountRef.value = pendingCheckInEvents.size;

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
      pendingCheckOutsCountRef.value = pendingCheckOutEvents.size;

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
       * Ref réactif du nombre de check-in en attente
       */
      pendingCheckInsCount: () => pendingCheckInsCountRef,

      /**
       * Ref réactif du nombre de check-out en attente
       */
      pendingCheckOutsCount: () => pendingCheckOutsCountRef,

      /**
       * Ref réactif booléen s'il y a des pendings
       */
      hasPendingDebounce: () =>
        computed(() => pendingCheckInsCountRef.value > 0 || pendingCheckOutsCountRef.value > 0),
    },
  };
};
