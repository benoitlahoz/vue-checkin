<script setup lang="ts">
import { useCheckIn, type CheckInItem, type DeskCore } from 'vue-airport';
import {
  AvailableDeskKey,
  TransferredDeskKey,
  EncodedDataDeskKey,
  type TransferableHeader,
  type TransferredDataItem,
} from '.';
import { createActiveItemPlugin, createCodecPlugin } from '@vue-airport/plugins-base';

export type TransferDesksProviderProps = {
  data: Record<string, any>[];
};

const props = defineProps<TransferDesksProviderProps>();

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

const removeKeyFromData = (item: CheckInItem<TransferredDataItem>, key: string) => {
  const { [key]: _, ...rest } = item.data;
  if (Object.keys(rest).length === 0) {
    return undefined;
  }

  return {
    id: item.id,
    data: rest,
  };
};

const onTransfer = async (id: string | number, desk: DeskCore<TransferableHeader>) => {
  const item = desk.get(id);
  if (item) {
    await transferredHeadersDesk.checkIn(id, item.data);
    return true;
  }
};

const onTransferred = async () => {
  // Build actual data when a new header is transferred
  const all = transferredHeadersDesk.getAll().map((item) => item.data.name);
  const encodedData = dataForHeaders(...all);
  encodedDataDesk.clear();
  await encodedDataDesk.checkInMany(
    encodedData.map((item, index) => ({
      id: `data-${index}`,
      data: item as TransferredDataItem,
    }))
  );
};

const onRetrieve = async (id: string | number, desk: DeskCore<TransferableHeader>) => {
  // Update encoded data when a header is retrieved
  const item = desk.get(id);
  if (item) {
    await availableHeadersDesk.checkIn(id, item.data);
    return true;
  }
};

const onRetrieved = async (id: string | number) => {
  // Now item is back in available desk
  const item = availableHeadersDesk.get(id);
  if (item) {
    const all = encodedDataDesk.getAll();
    const newRegistryData = all
      .map((dataItem) => removeKeyFromData(dataItem, id as string))
      .filter((dataItem): dataItem is CheckInItem<TransferredDataItem> => !!dataItem);
    encodedDataDesk.clear();
    await encodedDataDesk.checkInMany(newRegistryData);
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
  onCheckOut: onRetrieved,
});

// Encoded data desk
const { createDesk: createDataDesk } = useCheckIn<TransferredDataItem>();
const { desk: encodedDataDesk } = createDataDesk(EncodedDataDeskKey, {
  devTools: true,
  debug: false,
  plugins: [createCodecPlugin<TransferredDataItem, any>()],
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
