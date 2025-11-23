import type { DeskCore } from './desk/desk-core';

export type CheckInPluginMethod<T = any> = (...args: (T | any)[]) => any;
export type CheckInPluginComputedProp<T = any> = (desk: DeskCore<T, {}>) => any;

export type CheckInPluginMethods<T = any> = Record<string, CheckInPluginMethod<T>>;
export type CheckInPluginComputed<T = any> = Record<string, CheckInPluginComputedProp<T>>;

/**
 * Plugin interface for extending CheckInDesk functionality.
 * Plugins can hook into the desk lifecycle and add custom methods/properties.
 *
 * Warning: Plugins MUST implement dispose() for proper cleanup if they allocate resources or subscribe to events.
 *
 * @example
 * ```ts
 * const myPlugin: CheckInPlugin<MyData> = {
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   install: (desk) => {
 *     // Setup plugin state
 *     const subscription = desk.on('check-in', handleCheckIn);
 *
 *     // Return cleanup function
 *     return () => {
 *       subscription(); // Unsubscribe
 *     };
 *   },
 *   dispose: (desk) => {
 *     // Additional cleanup if needed
 *     console.log('Plugin disposed');
 *   },
 *   onCheckIn: (id, data) => {
 *     console.log('Item checked in:', id, data);
 *   },
 *   methods: {
 *     customMethod: (desk, arg) => {
 *       return desk.get(arg);
 *     }
 *   }
 * };
 * ```
 */
export interface CheckInPlugin<
  T = any,
  M extends object = CheckInPluginMethods<T>,
  C extends object = CheckInPluginComputed<T>,
> {
  /** Unique plugin name */
  name: string;

  /** Optional version */
  version?: string;

  /**
   * Called when the plugin is installed on a desk.
   * Return a cleanup function to be called when the desk is cleared.
   *
   * @required This is now required for proper plugin lifecycle management.
   */
  install: (desk: DeskCore<T>) => undefined | (() => void);

  /**
   * Called before an item is checked in.
   * Return false to cancel the check-in.
   */
  onBeforeCheckIn?: (
    id: string | number,
    data: T,
    desk: DeskCore<T>
  ) => boolean | undefined | Promise<boolean | undefined>;

  /**
   * Called after an item is successfully checked in.
   */
  onCheckIn?: (id: string | number, data: T, desk: DeskCore<T>) => void | Promise<void>;

  /**
   * Called before an item is updated.
   * Return false to cancel the update.
   */
  onBeforeUpdate?: (
    id: string | number,
    data: Partial<T>,
    desk: DeskCore<T>
  ) => boolean | undefined | Promise<boolean | undefined>;

  /**
   * Called after an item is successfully updated.
   */
  onUpdate?: (id: string | number, data: Partial<T>, desk: DeskCore<T>) => void | Promise<void>;

  /**
   * Called before an item is checked out.
   * Return false to cancel the check-out.
   */
  onBeforeCheckOut?: (
    id: string | number,
    desk: DeskCore<T>
  ) => boolean | undefined | Promise<boolean | undefined>;

  /**
   * Called after an item is successfully checked out.
   */
  onCheckOut?: (id: string | number, desk: DeskCore<T>) => void | Promise<void>;

  /**
   * Custom methods to add to the desk.
   * First parameter is always the desk itself.
   */
  methods?: M;

  /**
   * Computed properties to add to the desk.
   * Getters receive the desk as parameter.
   */
  computed?: C;
}
