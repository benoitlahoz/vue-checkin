<script setup lang="ts">
import { useCheckIn } from '#vue-airport';
import { cn } from '@/lib/utils';
import {
  AvailableDeskKey,
  type TransferableHeader,
  type TransferListDesk,
  TransferredDeskKey,
} from '.';
import { Button } from '@/components/ui/button';

type AvailableDesk = typeof availableDesk & TransferListDesk;
type TransferredDesk = typeof transferredDesk & TransferListDesk;

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
const isActive = computed(() => {
  return (
    (availableDesk as AvailableDesk).activeId.value === props.id ||
    (transferredDesk as TransferredDesk).activeId.value === props.id
  );
});

const checkOut = () => {
  if (isTransferred.value) {
    transferredDesk!.checkOut(props.id);
  } else {
    availableDesk!.checkOut(props.id);
  }
};

const setActive = () => {
  if (isTransferred.value) {
    (availableDesk as AvailableDesk).clearActive();
    (transferredDesk as TransferredDesk).setActive(props.id);
  } else {
    (transferredDesk as TransferredDesk).clearActive();
    (availableDesk as AvailableDesk).setActive(props.id);
  }
};
</script>

<template>
  <div
    data-slot="transferable-item"
    :class="
      cn(
        'p-2 border border-border rounded-md flex items-center justify-between select-none hover:bg-accent hover:text-accent-foreground group',
        isTransferred ? 'pr-4' : 'pl-4',
        isActive ? 'bg-primary/10 dark:bg-primary/10 border-primary' : ''
      )
    "
    @click="setActive"
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
      <div class="flex items-center gap-1">
        <Button size="icon" variant="ghost" class="text-destructive/80 hover:text-destructive">
          <UIcon name="i-tabler:transform" />
        </Button>
        <div class="font-bold uppercase">{{ item?.name }}</div>
      </div>
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
