/**
 * This example creates a desk for a transfer list with optional transformation.
 * It demonstrates how to use a transfer list component with Vue Airport.
 */
import type { InjectionKey, Ref } from 'vue';
import type { DeskWithContext } from '#vue-airport';
import type { CodecPluginExports } from '@vue-airport/plugins-base';

// Definition of transferable header item
export interface TransferableHeader {
  id: string;
  name: string;
}

// The actual data item structure used in the transfer list
export interface TransferredDataItem {
  id: string;
  [key: string]: string | number | boolean | null | undefined;
}

// What we want to transfer are headers.
export type TransferListDesk = DeskWithContext<TransferableHeader>;

export interface TransferDataContext {
  keysOrder: Ref<string[]>;
  updateKeysOrder: (keys?: string[]) => void;
}

export type TransferDataDesk = DeskWithContext<TransferredDataItem, TransferDataContext> &
  CodecPluginExports<TransferredDataItem, any>;

// Only available headers
export const AvailableDeskKey: InjectionKey<Ref<TransferableHeader>> = Symbol('AvailableDesk');
// Only transferred headers
export const TransferredDeskKey: InjectionKey<Ref<TransferableHeader>> = Symbol('TransferredDesk');
// Final data structure desk
export const EncodedDataDeskKey: InjectionKey<Ref<TransferredDataItem>> = Symbol('EncodedDesk');

export { default as TransferListEncode } from './TransferListEncode.vue';
export { default as DesksProvider } from './DesksProvider.vue';
export { default as TransferList } from './TransferList.vue';
export { default as Transferable } from './Transferable.vue';
export { default as DataTable } from './DataTable.vue';
export { default as DataTableHeader } from './DataTableHeader.vue';
export { default as DataTableCodec } from './DataTableCodec.vue';
export { default as CsvDownloader } from './CsvDownloader.vue';
