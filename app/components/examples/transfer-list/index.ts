/**
 * This example creates a desk for a transfer list.
 * It demonstrates how to use a transfer list component with Vue Airport.
 */

import type { InjectionKey, Ref } from 'vue';

export interface TransferListItem {
  id: number | string;
  [key: string]: any;
  transferred?: boolean;
}

export interface TransferListContext {
  data: Ref<TransferListItem[]>;
}

export const TransferListKey: InjectionKey<Ref<TransferListItem> & TransferListContext> =
  Symbol('TransferList');

export { default as TransferList } from './TransferList.vue';
export { default as TransferListItem } from './TransferListItem.vue';
