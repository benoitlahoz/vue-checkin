import type { DeskWithContext } from '#vue-airport';

export interface TransferableItem {
  id: string;
  name: string;
  transferred?: boolean;
}

export type UseTransferListReturn<T extends TransferableItem = TransferableItem> = {
  available: Ref<T[]>;
  transferred: Ref<T[]>;
  data: Record<string, any>[];
  transfer: (id: T['id']) => void;
  retrieve: (id: T['id']) => void;
  isTransferred: (id: T['id']) => boolean;
  getTransferableById: (id: T['id']) => T | undefined;
  dataForKey: (key: T['id']) => Record<string, any>[];
};

export const useTransferList = <T extends TransferableItem, U extends Record<string, any>>(
  desk: DeskWithContext<T, U>,
  data: Record<string, any>[]
): UseTransferListReturn<T> => {
  {
    const available: Ref<T[]> = ref([]);
    const transferred: Ref<T[]> = ref([]);
    const discriminatedData = data.map((item) => ({
      ...item,
      // Data has a unique ID different from the transferable items
      id: item.id || `item-${Math.random().toString(36).substr(2, 9)}`,
    }));

    const uniqueKeys = Object.keys(data[0] ?? {});

    available.value = uniqueKeys.map((key) => ({
      // Each transferable item has a unique ID
      id: key,
      name: key,
      transferred: false,
    })) as T[];

    for (const item of discriminatedData) {
      // Check in the data, NOT the transferable items
      desk.checkIn(item.id, item as T);
    }

    const transfer = (id: T['id']) => {
      const availableItem = available.value.find((i) => i.id === id);
      if (!availableItem) return;

      const itemIndex = available.value.indexOf(availableItem);
      if (itemIndex === -1) return;

      const [item] = available.value.splice(itemIndex, 1);
      transferred.value.push(item as T);
    };

    const retrieve = (id: T['id']) => {
      const transferredItem = transferred.value.find((i) => i.id === id);
      if (!transferredItem) return;

      const itemIndex = transferred.value.indexOf(transferredItem);
      if (itemIndex === -1) return;

      const [item] = transferred.value.splice(itemIndex, 1);
      available.value.push(item as T);
    };

    const isTransferred = (id: T['id']) => {
      return transferred.value.find((i) => i.id === id) !== undefined;
    };

    const getTransferableById = (id: T['id']) => {
      return available.value.find((i) => i.id === id) || transferred.value.find((i) => i.id === id);
    };

    const dataForKey = (key: T['id']) => {
      const item = [...available.value, ...transferred.value].find((i) => i.id === key);
      if (!item) return [];

      return discriminatedData.map((d) => {
        return d[key as keyof typeof d];
      });
    };

    return {
      available,
      transferred,
      data: discriminatedData,
      transfer,
      retrieve,
      isTransferred,
      getTransferableById,
      dataForKey,
    };
  }
};
