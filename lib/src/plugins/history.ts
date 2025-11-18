import { ref } from 'vue';
import type { CheckInPlugin, DeskCore } from '../composables';

export interface HistoryEntry<T = unknown> {
  action: 'check-in' | 'check-out' | 'update';
  id: string | number;
  data?: T;
  timestamp: number;
}

export interface HistoryOptions {
  /** Maximum number of history entries to keep */
  maxHistory?: number;
}

/**
 * Plugin to track history of check-in/check-out/update operations.
 * Provides a reactive log of all desk operations with timestamps.
 *
 * @example
 * ```ts
 * const { desk } = createDesk(Symbol('items'), {
 *   plugins: [
 *     createHistoryPlugin({ maxHistory: 100 })
 *   ]
 * });
 *
 * // Get the full history
 * const history = desk.getHistory();
 *
 * // Get recent history
 * const recent = desk.getLastHistory(10);
 *
 * // Filter by action type
 * const checkIns = desk.getHistoryByAction('check-in');
 *
 * // Clear history
 * desk.clearHistory();
 * ```
 */
export const createHistoryPlugin = <T = unknown>(options?: HistoryOptions): CheckInPlugin<T> => {
  const maxHistory = options?.maxHistory || 50;
  const history = ref<HistoryEntry<T>[]>([]);

  return {
    name: 'history',
    version: '1.0.0',

    install: (desk: DeskCore<T>) => {
      // Add history to desk
      (desk as any).history = history;

      // Cleanup
      return () => {
        history.value = [];
      };
    },

    // Use lifecycle hooks instead of desk.on() for better DevTools tracking
    onCheckIn(id: string | number, data: T) {
      history.value.push({ action: 'check-in', id, data: data as any, timestamp: Date.now() });
      if (history.value.length > maxHistory) {
        history.value.shift();
      }
    },

    onCheckOut(id: string | number) {
      history.value.push({ action: 'check-out', id, timestamp: Date.now() });
      if (history.value.length > maxHistory) {
        history.value.shift();
      }
    },

    onUpdate(id: string | number, data: Partial<T>) {
      history.value.push({ action: 'update', id, data: data as any, timestamp: Date.now() });
      if (history.value.length > maxHistory) {
        history.value.shift();
      }
    },

    methods: {
      /**
       * Get the history of operations
       */
      getHistory(desk: DeskCore<T>): HistoryEntry<T>[] {
        return (desk as any).history?.value || [];
      },

      /**
       * Clear the history
       */
      clearHistory(desk: DeskCore<T>) {
        const deskWithHistory = desk as any;
        if (deskWithHistory.history) {
          deskWithHistory.history.value = [];
        }
      },

      /**
       * Get last N history entries
       */
      getLastHistory(desk: DeskCore<T>, count: number): HistoryEntry<T>[] {
        const history = (desk as any).history?.value || [];
        return history.slice(-count);
      },

      /**
       * Get history filtered by action type
       */
      getHistoryByAction(
        desk: DeskCore<T>,
        action: 'check-in' | 'check-out' | 'update'
      ): HistoryEntry<T>[] {
        const history = (desk as any).history?.value || [];
        return history.filter((entry: HistoryEntry<T>) => entry.action === action);
      },
    },
  };
};
