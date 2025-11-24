<script setup lang="ts">
import { useCheckIn } from '#vue-airport';
import { cn } from '@/lib/utils';
import {
  type TransferListItem,
  type TransferListContext,
  type TransferListDesk,
  TransferListKey,
} from '.';

const props = defineProps<{ id: string }>();

const { checkIn } = useCheckIn<TransferListItem, TransferListContext>();
const { desk } = checkIn(TransferListKey, {
  autoCheckIn: false,
  watchData: true,
  data: (desk) => {
    const item =
      desk.getContext<TransferListContext>()?.available.value.find((i) => i.id === props.id) ||
      desk.getContext<TransferListContext>()?.transferred.value.find((i) => i.id === props.id);
    return item as TransferListItem;
  },
});
const deskWithPlugins = desk as typeof desk & TransferListDesk;

const item = computed(() => {
  const item =
    desk?.getContext<TransferListContext>()?.available.value.find((i) => i.id === props.id) ||
    desk?.getContext<TransferListContext>()?.transferred.value.find((i) => i.id === props.id);
  return item;
});

const isActive = computed(() => deskWithPlugins.activeId?.value === props.id);

const setActive = () => {
  deskWithPlugins.setActive(props.id);
};
</script>

<template>
  <div
    data-slot="transfer-list-item"
    :class="
      cn(
        'p-2 border border-border rounded-md cursor-pointer',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-accent hover:text-accent-foreground'
      )
    "
    @click="setActive"
  >
    {{ item?.name }}
  </div>
</template>
