<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
// import { useCsv } from './useCsv';
import { Transferable, AvailableDeskKey, type TransferableHeader, TransferredDeskKey } from '.';

import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// const { toCsv, downloadCsv } = useCsv();

const { checkIn } = useCheckIn<TransferableHeader>();
const { desk: availableDesk } = checkIn(AvailableDeskKey, {
  watchData: true,
});
const { desk: transferredDesk } = checkIn(TransferredDeskKey, {
  watchData: true,
});

const available = computed(() => availableDesk!.registryList.value || []);
const transferred = computed(() => transferredDesk!.registryList.value || []);
const size = computed(() => 0);

const csv = computed(() => {
  /*
  const obj = ctx.toObject();
  return obj ? toCsv(obj || [], true, ',') : '';
  */
  return '';
});
const download = () => {
  /*
  const obj =  ctx.toObject();
  if (obj) {
    downloadCsv(obj, 'transfer-list.csv', true, ',');
  }
  */
};
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex flex-col h-64 min-h-64 md:flex-row gap-4 md:gap-2">
      <div class="flex-1 flex flex-col p-2 border border-border rounded-md gap-1 overflow-y-auto">
        <Transferable v-for="item in available" :id="String(item.id)" :key="item.id" />
      </div>
      <div class="flex-1 flex flex-col p-2 border border-border rounded-md gap-1 overflow-y-auto">
        <Transferable v-for="item in transferred" :id="String(item.id)" :key="item.id" />
      </div>
    </div>

    <Separator />
    <Accordion type="single" collapsible class="w-full">
      <AccordionItem value="csv" :disabled="size === 0">
        <AccordionTrigger class="hover:no-underline"
          >CSV Content - {{ size }} rows & header</AccordionTrigger
        >
        <AccordionContent>
          <Button :disabled="size === 0" class="my-2" @click="download">Download CSV</Button>
          <textarea
            class="w-full h-48 p-2 border border-border rounded-md font-mono text-sm"
            readonly
            :value="csv"
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>
