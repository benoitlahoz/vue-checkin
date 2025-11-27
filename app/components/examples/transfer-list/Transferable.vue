<script setup lang="ts">
import { useCheckIn } from '#vue-airport';
import { cn } from '@/lib/utils';
import { AvailableDeskKey, type TransferableHeader, TransferredDeskKey } from '.';
import { Button } from '@/components/ui/button';

const props = defineProps<{ id: string }>();

const { checkIn } = useCheckIn<TransferableHeader>();
const { desk: availableDesk } = checkIn(AvailableDeskKey, {
  watchData: true,
});
const { desk: transferredDesk } = checkIn(TransferredDeskKey, {
  watchData: true,
});

const item = computed(() => {
  return availableDesk!.get(props.id)?.data || transferredDesk!.get(props.id)?.data;
});

const isTransferred = computed(() => {
  return !!transferredDesk!.has(props.id);
});

const checkOut = () => {
  if (isTransferred.value) {
    transferredDesk!.checkOut(props.id);
  } else {
    availableDesk!.checkOut(props.id);
  }
};
</script>

<template>
  <div
    data-slot="transferable-item"
    :class="
      cn(
        'p-2 border border-border rounded-md flex items-center justify-between select-none hover:bg-accent hover:text-accent-foreground group',
        isTransferred ? 'pr-4' : 'pl-4'
      )
    "
  >
    <template v-if="isTransferred">
      <Button
        size="icon"
        variant="ghost"
        class="md:invisible md:group-hover:visible"
        @click="checkOut"
      >
        <UIcon name="lucide:arrow-left" class="hidden md:block" />
        <UIcon name="lucide:arrow-up" class="md:hidden" />
      </Button>
      <div class="font-bold uppercase">{{ item?.name }}</div>
    </template>
    <template v-if="!isTransferred">
      <div class="font-bold uppercase">{{ item?.name }}</div>
      <Button
        size="icon"
        variant="ghost"
        class="md:invisible md:group-hover:visible"
        @click="checkOut"
      >
        <UIcon name="lucide:arrow-right" class="hidden md:block" />
        <UIcon name="lucide:arrow-down" class="md:hidden" />
      </Button>
    </template>
  </div>
</template>
