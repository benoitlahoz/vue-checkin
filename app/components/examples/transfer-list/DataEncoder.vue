<script setup lang="ts">
import { useCheckIn } from '#vue-airport';
import {
  EncodedDataDeskKey,
  TransferredDeskKey,
  type TransferableHeader,
  type TransferListDesk,
  type TransferredDataItem,
} from '.';

type TransferredDeskType = typeof transferredDesk & TransferListDesk;

const codecs = {
  name: [
    {
      name: 'split-name',
      prop: 'name',
      targets: ['firstname', 'lastname'],
      encode: (item: TransferredDataItem, prop: string, targets: string[]) => {
        if (!item[prop]) {
          return item;
        }

        const split = (item[prop] as string).split(' ');

        // Delete the 'name' property in the original object.
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete item[prop];
        const result = {
          ...item,
          [targets[0] as string]: split[0] as string,
          [targets[1] as string]: split[1] as string,
        };
        return result;
      },
    },
    {
      name: 'capitalize-firstname',
      prop: 'firstname',
      encode: (item: TransferredDataItem, prop: string) => {
        return {
          ...item,
          [prop]: (item[prop] as string)
            .charAt(0)
            .toUpperCase()
            .concat((item[prop] as string).slice(1).toLowerCase()),
        };
      },
    },
    {
      name: 'uppercase-lastname',
      prop: 'lastname',
      encode: (item: TransferredDataItem, prop: string) => {
        return {
          ...item,
          [prop]: (item[prop] as string).toUpperCase(),
        };
      },
    },
  ],
};

const addedCodecs = ref<string[]>([]);

const { checkIn: checkInEncoded } = useCheckIn<TransferredDataItem>();
const { desk: encodedDesk } = checkInEncoded(EncodedDataDeskKey, {
  watchData: true,
});
const { checkIn: checkInTransferred } = useCheckIn<TransferableHeader>();
const { desk: transferredDesk } = checkInTransferred(TransferredDeskKey, {
  watchData: true,
});

const activeId = computed(() => {
  return (transferredDesk as TransferredDeskType).activeId.value;
});
</script>

<template>
  <div>{{ activeId }}</div>
</template>
