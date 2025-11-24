/**
 * This example creates a desk for a transfer list.
 * It demonstrates how to use a transfer list component with Vue Airport.
 */
import type { InjectionKey, Ref } from 'vue';
import type { DeskWithContext } from '#vue-airport';
import type { TransformValuePluginExports } from '@vue-airport/plugins-base/transformValue';
import type { TransferableItem, UseTransferListReturn } from './useTransferList';

// The actual data item structure used in the transfer list
export interface TransferListDataItem {
  id: string;
  [key: string]: string | number | boolean | null | undefined;
}

export type TransferListContext = UseTransferListReturn;

// What we want to transfer are headers.
export type TransferListDesk = DeskWithContext<TransferableItem, TransferListContext> &
  TransformValuePluginExports<TransferableItem>;

export const TransferListKey: InjectionKey<Ref<TransferableItem> & TransferListContext> =
  Symbol('TransferList');

export { default as TransferList } from './TransferList.vue';
export { default as Transferable } from './Transferable.vue';
