<script setup lang="ts">
import { useCheckIn } from '#vue-airport';
import { cn } from '@/lib/utils';
import { type TransferListContext, TransferListKey } from '.';
import { Button } from '@/components/ui/button';
import type { TransferableItem } from './useTransferList';

const props = defineProps<{ id: string }>();

const { checkIn } = useCheckIn<TransferableItem, TransferListContext>();
const { desk } = checkIn(TransferListKey);
const ctx = desk?.getContext<TransferListContext>();

const item = computed(() => {
  const item = ctx?.getTransferableById(props.id) || null;
  return item;
});

const isTransferred = computed(() => ctx?.isTransferred(props.id) || false);
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
    <Button
      v-if="isTransferred"
      size="icon"
      variant="ghost"
      class="invisible group-hover:visible"
      @click="ctx?.retrieve(props.id)"
    >
      ←
    </Button>
    <div class="font-bold uppercase">{{ item?.name }}</div>
    <Button
      v-if="!isTransferred"
      size="icon"
      variant="ghost"
      class="invisible group-hover:visible"
      @click="ctx?.transfer(props.id)"
    >
      →
    </Button>
  </div>
</template>
