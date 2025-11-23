import { ref } from 'vue';
import type { CheckInPlugin, DeskCore } from 'vue-airport';

export interface ActiveItemPluginMethods<T> {
  /**
   * Set the active item by ID.
   * @param desk The desk instance.
   * @param id The item ID or null to clear.
   * @returns True if set/cleared, false if not found.
   */
  setActive(desk: DeskCore<T>, id: string | number | null): boolean;

  /**
   * Get the currently active item.
   * @param desk The desk instance.
   * @returns The active item or null.
   */
  getActive(desk: DeskCore<T>): T | null;

  /**
   * Clear the active item.
   * @param desk The desk instance.
   * @returns True if cleared.
   */
  clearActive(desk: DeskCore<T>): boolean;
}

export interface ActiveItemPluginComputed<T> {
  /**
   * Check if there is an active item.
   * @param desk The desk instance.
   * @returns True if an active item exists.
   */
  hasActive(desk: DeskCore<T>): boolean;
}

/**
 * Interface for the ActiveItem plugin, extending CheckInPlugin.
 * Provides methods and computed properties for managing an active item in the desk.
 */
export interface ActiveItemPlugin<T>
  extends CheckInPlugin<T, ActiveItemPluginMethods<T>, ActiveItemPluginComputed<T>> {
  methods: ActiveItemPluginMethods<T>;
  computed: ActiveItemPluginComputed<T>;
}

/**
 * Plugin to manage an active item in the desk.
 * Adds methods: setActive, getActive, clearActive
 * Adds computed: hasActive
 * Adds property: activeId
 * Emits event: 'active-changed'
 *
 * @example
 * ```ts
 * const { desk } = createDesk(Symbol('handlers'), {
 *   plugins: [createActiveItemPlugin()]
 * });
 *
 * desk.setActive('item-1');
 * const active = desk.getActive();
 * console.log(desk.hasActive); // true
 * ```
 */

export enum ActiveItemEvent {
  Changed = 'active:changed',
}

/**
 * Create an ActiveItem plugin for DeskCore.
 * Adds methods and computed properties to manage an active item.
 *
 * @returns {ActiveItemPlugin<T>} The plugin instance.
 */
export const createActiveItemPlugin = <T = unknown>(): ActiveItemPlugin<T> => ({
  name: 'active-item',
  version: '1.0.0',

  install: (desk: DeskCore<T>) => {
    // Add reactive activeId state
    const activeId = ref<string | number | null>(null);
    (desk as any).activeId = activeId;

    // Cleanup
    return () => {
      activeId.value = null;
    };
  },

  methods: {
    /**
     * Set the active item by ID
     */
    setActive(desk: DeskCore<T>, id: string | number | null) {
      const deskWithActive = desk as any;
      const startTime = performance.now();
      const deskId = deskWithActive.__deskId;

      if (id === null) {
        deskWithActive.activeId.value = null;
        // Emit with undefined instead of null for type safety
        desk.emit(ActiveItemEvent.Changed as any, {
          id: undefined,
          data: undefined,
        });

        // Track in DevTools
        const duration = performance.now() - startTime;
        if (deskId) {
          desk.devTools.emit({
            type: 'plugin-execute',
            timestamp: Date.now(),
            deskId,
            pluginName: 'active-item',
            duration,
            data: { action: 'clearActive' },
          });
        }

        return true;
      }

      if (!desk.has(id)) return false;

      deskWithActive.activeId.value = id;
      desk.emit(ActiveItemEvent.Changed as any, {
        id,
        data: desk.get(id)?.data,
      });

      // Track in DevTools
      const duration = performance.now() - startTime;
      if (deskId) {
        desk.devTools.emit({
          type: 'plugin-execute',
          timestamp: Date.now(),
          deskId,
          childId: id,
          pluginName: 'active-item',
          duration,
          data: { action: 'setActive' },
        });
      }

      return true;
    },

    /**
     * Get the currently active item
     */
    getActive(desk: DeskCore<T>) {
      const deskWithActive = desk as any;
      const id = deskWithActive.activeId?.value;
      if (!id) return null;
      const item = desk.get(id);
      return item?.data ?? null;
    },

    /**
     * Clear the active item
     */
    clearActive(desk: DeskCore<T>) {
      const deskWithActive = desk as any;
      return deskWithActive.setActive?.(null);
    },
  },

  computed: {
    /**
     * Check if there's an active item
     */
    hasActive(desk: DeskCore<T>) {
      const deskWithActive = desk as any;
      return deskWithActive.activeId?.value !== null;
    },
  },
});
