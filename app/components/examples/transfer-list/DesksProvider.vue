<script setup lang="ts">
import { useCheckIn, type DeskCore } from 'vue-airport';
import {
  AvailableDeskKey,
  TransferredDeskKey,
  EncodedDataDeskKey,
  type TransferableHeader,
  type TransferDataItem,
} from '.';
import { createActiveItemPlugin } from '@vue-airport/plugins-base';

export type TransferDesksProviderProps = {
  data?: Record<string, any>[];
};

const props = withDefaults(defineProps<TransferDesksProviderProps>(), {
  data: () => [],
});

const headers = computed(() => {
  if (props.data && props.data[0]) {
    return Object.keys(props.data[0]).map((key) => ({
      id: key,
      name: key,
    }));
  }
  return [];
});

const dataForHeaders = (...headers: string[]) => {
  return (
    props.data?.map((item) => {
      const newItem: Record<string, any> = {};
      headers.forEach((header) => {
        newItem[header] = item[header];
      });
      return newItem;
    }) || []
  );
};

const removeKeyFromData = (data: TransferDataItem, key: string) => {
  const { [key]: _, ...rest } = data;
  return rest;
};

const onTransfer = (id: string | number, desk: DeskCore<TransferableHeader>) => {
  const item = desk.get(id);
  if (item) {
    transferredHeadersDesk.checkIn(id, item.data);
    return true;
  }
};

const onTransferred = () => {
  // Build actual data when a new header is transferred
  const all = transferredHeadersDesk.getAll().map((item) => item.data.name);
  const encodedData = dataForHeaders(...all);
  encodedDataDesk.clear();
  encodedDataDesk.checkInMany(
    encodedData.map((item, index) => ({
      id: `data-${index}`,
      data: item as TransferDataItem,
    }))
  );
};

const onRetrieve = (id: string | number, desk: DeskCore<TransferableHeader>) => {
  // Update encoded data when a header is retrieved
  const item = desk.get(id);
  if (item) {
    availableHeadersDesk.checkIn(id, item.data);
    const all = encodedDataDesk.getAll();
    encodedDataDesk.updateMany(
      all.map((dataItem) => ({
        id: dataItem.id,
        data: removeKeyFromData(dataItem.data, id as string),
      }))
    );
    return true;
  }
};

const { createDesk: createHeadersDesk } = useCheckIn<TransferableHeader>();

// Available headers desk
const { desk: availableHeadersDesk } = createHeadersDesk(AvailableDeskKey, {
  devTools: true,
  debug: false,
  plugins: [createActiveItemPlugin<TransferableHeader>()],
  onBeforeCheckOut: onTransfer,
});

// Transferred headers desk (same type: we can reuse createDesk)
const { desk: transferredHeadersDesk } = createHeadersDesk(TransferredDeskKey, {
  devTools: true,
  debug: false,
  plugins: [createActiveItemPlugin<TransferableHeader>()],
  onCheckIn: onTransferred,
  onBeforeCheckOut: onRetrieve,
});

// Encoded data desk
const { createDesk: createDataDesk } = useCheckIn<TransferDataItem>();
const { desk: encodedDataDesk } = createDataDesk(EncodedDataDeskKey, {
  devTools: true,
  debug: false,
});

watch(
  () => headers.value,
  (newHeaders) => {
    availableHeadersDesk.clear();
    transferredHeadersDesk.clear();
    encodedDataDesk.clear();
    newHeaders.forEach((header) => {
      availableHeadersDesk.checkIn(header.id, header);
    });
  },
  { immediate: true }
);
</script>

<template>
  <slot />
</template>
