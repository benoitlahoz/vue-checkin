import type { DeskCore, CheckInPlugin } from 'vue-airport';
import type { Store } from 'pinia';
// On attend que l'utilisateur fournisse les stores à la création du plugin

export interface PiniaStoreConfig<T = unknown> {
  store: Store;
  onBeforeCheckIn?: (id: string | number, data: T, desk?: DeskCore<T>) => boolean;
  onCheckIn?: (id: string | number, data: T, desk?: DeskCore<T>) => void;
  onBeforeCheckOut?: (id: string | number, desk?: DeskCore<T>) => boolean;
  onCheckOut?: (id: string | number, desk?: DeskCore<T>) => void;
}

export interface PiniaOptions<T = unknown> {
  handlers: Array<PiniaStoreConfig<T>>;
}

/**
 * Plugin pour synchroniser le desk avec un ou plusieurs stores Pinia.
 * Les stores doivent exposer addItem et removeItem.
 *
 * @example
 * ```ts
 * import { useMyStore } from '@/stores/myStore';
 * const { desk } = createDesk(Symbol('members'), {
 *   plugins: [createPiniaPlugin({ handlers: [{ store: useMyStore() }] })]
 * });
 * ```
 */
export function createPiniaPlugin<T>(options: PiniaOptions<T>): CheckInPlugin<T> {
  return {
    name: 'pinia',
    version: '1.0.0',

    install(desk: DeskCore<T>) {
      /*
      (desk as any).syncAllToStores = () => {
        options.handlers.forEach((store: PiniaSyncStoreConfig<T>) => {
          if (store.syncAllToStore) {
            store.syncAllToStore(desk);
          } else {
            desk.getAll().forEach((item: { data: T; id: string | number }) => {
              if (store.onCheckIn) {
                store.onCheckIn(item.id, item.data, desk);
              }
            });
          }
        });
      };

      (desk as any).clearAllFromStores = () => {
        options.handlers.forEach((store: PiniaSyncStoreConfig<T>) => {
          if (store.clearAllFromStore) {
            store.clearAllFromStore(desk);
          } else {
            desk.getAll().forEach((item: { id: string | number }) => {
              if (store.onCheckOut) {
                store.onCheckOut(item.id, desk);
              }
            });
          }
        });
      };
*/
      // Cleanup
      return () => {
        (desk as any).clearAllFromStores();
      };
    },

    onBeforeCheckIn(id: string | number, data: T, desk?: DeskCore<T>) {
      options.handlers.forEach((store: PiniaStoreConfig<T>) => {
        if (store.onBeforeCheckIn) {
          store.onBeforeCheckIn(id, data, desk);
        }
      });
    },

    onCheckIn(id: string | number, data: T, desk?: DeskCore<T>) {
      options.handlers.forEach((store: PiniaStoreConfig<T>) => {
        if (store.onCheckIn) {
          store.onCheckIn(id, data, desk);
        }
      });
    },

    onBeforeCheckOut(id: string | number, desk?: DeskCore<T>) {
      options.handlers.forEach((store: PiniaStoreConfig<T>) => {
        if (store.onBeforeCheckOut) {
          store.onBeforeCheckOut(id, desk);
        }
      });
    },

    onCheckOut(id: string | number, desk?: DeskCore<T>) {
      options.handlers.forEach((store: PiniaStoreConfig<T>) => {
        if (store.onCheckOut) {
          store.onCheckOut(id, desk);
        }
      });
    },
  };
}
