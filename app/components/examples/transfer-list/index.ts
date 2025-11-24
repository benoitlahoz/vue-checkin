/**
 * This example creates a desk for a transfer list.
 * It demonstrates how to use a transfer list component with Vue Airport.
 */

import type { DeskWithContext } from '#vue-airport';
import type { ActiveItemPluginExports } from '@vue-airport/plugins-base/activeItem';
import type { TransformValuePluginExports } from '@vue-airport/plugins-base/transformValue';
import type { InjectionKey, Ref } from 'vue';

export interface TransferListItem {
  id: string;
  name: string;
  transferred?: boolean;
}

export interface TransferListContext {
  available: Ref<TransferListItem[]>;
  transferred: Ref<TransferListItem[]>;
}

export type TransferListDesk = DeskWithContext<TransferListItem, TransferListContext> &
  ActiveItemPluginExports<TransferListItem> &
  TransformValuePluginExports<TransferListItem>;

export const TransferListKey: InjectionKey<Ref<TransferListItem> & TransferListContext> =
  Symbol('TransferList');

export { default as TransferList } from './TransferList.vue';
export { default as TransferListItem } from './TransferListItem.vue';
