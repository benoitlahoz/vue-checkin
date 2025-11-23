<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { type TransferListContext, type TransferItemData, TRANSFER_LIST_DESK_KEY } from '.';

const props = defineProps<{
  id: string | number;
}>();

const { checkIn } = useCheckIn<TransferItemData, TransferListContext>();
const { desk } = checkIn(TRANSFER_LIST_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: (desk) => {
    const item = desk.transferItems?.value.find((t) => t.id === props.id);
    if (!item) return { name: '' };
    return item;
  },
});

const itemData = computed(() => {
  return desk?.transferItems?.value.find((t) => t.id === props.id);
});
</script>

<template>
  <li>
    <span v-if="itemData?.firstname && itemData?.lastname">
      {{ itemData.firstname }} {{ itemData.lastname }}
    </span>
    <span v-else>
      {{ itemData?.name }}
    </span>
  </li>
</template>
