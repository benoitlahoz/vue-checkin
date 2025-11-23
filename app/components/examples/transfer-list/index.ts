import type { DeskWithContext } from '#vue-airport';
import type { InjectionKey, Ref } from 'vue';

export { default as TransferList } from './TransferList.vue';
export { default as TransferListItem } from './TransferListItem.vue';

export interface TransferItemData {
  id: string | number;
  name: string;
  firstname?: string;
  lastname?: string;
}

export interface TransferListContext {
  transferItems: Ref<TransferItemData[]>;
  availableItems: Ref<TransferItemData[]>;
  addToTransfer: (row: TransferItemData) => void;
  applyTransform: () => void;
}

export type DeskWithTransferList = DeskWithContext<TransferItemData, TransferListContext>;

export const DESK_TRANSFER_LIST_KEY: InjectionKey<DeskWithTransferList> =
  Symbol('transferListDesk');
