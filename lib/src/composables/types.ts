import type { DeskCore } from './desk-core';

/**
 * Plugin interface for extending CheckInDesk functionality.
 * Plugins can hook into the desk lifecycle and add custom methods/properties.
 * 
 * ⚠️ BREAKING CHANGE: Plugins now MUST implement dispose() for proper cleanup.
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
export interface CheckInPlugin<T = any> {
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
  install: (desk: DeskCore<T>) => void | (() => void);

  /**
   * Called when the plugin is explicitly disposed or desk is cleared.
   * Use this for additional cleanup beyond the install() cleanup function.
   * 
   * @required This is now required for proper plugin lifecycle management.
   */
  dispose?: (desk: DeskCore<T>) => void;

  /**
   * Called before an item is checked in.
   * Return false to cancel the check-in.
   */
  onBeforeCheckIn?: (id: string | number, data: T) => boolean | undefined;

  /**
   * Called after an item is successfully checked in.
   */
  onCheckIn?: (id: string | number, data: T) => void;

  /**
   * Called before an item is checked out.
   * Return false to cancel the check-out.
   */
  onBeforeCheckOut?: (id: string | number) => boolean | undefined;

  /**
   * Called after an item is successfully checked out.
   */
  onCheckOut?: (id: string | number) => void;

  /**
   * Custom methods to add to the desk.
   * First parameter is always the desk itself.
   */
  methods?: Record<string, (desk: DeskCore<T>, ...args: any[]) => any>;

  /**
   * Computed properties to add to the desk.
   * Getters receive the desk as parameter.
   */
  computed?: Record<string, (desk: DeskCore<T>) => any>;
}
