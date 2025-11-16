import type { CheckInPlugin } from '../composables/types';

export interface LoggerOptions {
  /** Prefix for log messages */
  prefix?: string;

  /** Log level */
  logLevel?: 'info' | 'debug';

  /** Enable detailed logging */
  verbose?: boolean;
}

/**
 * Plugin to log check-in/check-out operations.
 * Useful for debugging and monitoring desk activity.
 *
 * @example
 * ```ts
 * const { desk } = createDesk('handlers', {
 *   plugins: [
 *     createLoggerPlugin({
 *       prefix: '[FeaturesEditor]',
 *       verbose: true
 *     })
 *   ]
 * });
 * ```
 */
export const createLoggerPlugin = <T = unknown>(options?: LoggerOptions): CheckInPlugin<T> => {
  const prefix = options?.prefix || '[CheckIn]';
  const verbose = options?.verbose ?? false;

  return {
    name: 'logger',
    version: '1.0.0',

    onCheckIn: (id: string | number, data: T) => {
      if (verbose) {
        console.log(`${prefix} ✅ Item checked in:`, { id, data });
      } else {
        console.log(`${prefix} ✅ Item checked in:`, id);
      }
    },

    onCheckOut: (id: string | number) => {
      console.log(`${prefix} ❌ Item checked out:`, id);
    },
  };
};
