<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useSortable } from '@vueuse/integrations/useSortable';
import { useCheckIn } from 'vue-airport';
import { createActiveItemPlugin } from '@vue-airport/plugins-base';
import { useTransferList, type TransferableItem } from './useTransferList';
import { useCsv } from './useCsv';
import { CsvFile } from './fixtures';
import { type TransferListContext, type TransferListDesk, TransferListKey, Transferable } from '.';

import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const { fromCsv, toCsv, downloadCsv } = useCsv();
const { rows } = fromCsv(CsvFile, true, ',');

const plugins = [createActiveItemPlugin<TransferableItem>()];

const { createDesk } = useCheckIn<TransferableItem, TransferListContext>();
const { desk } = createDesk(TransferListKey, {
  devTools: true,
  debug: false,
  plugins,
});
const ctx = desk.setContext(useTransferList<TransferableItem>(desk, rows))!;

const main = useTemplateRef('main');
const availableItems = useTemplateRef('availableItems');
const transferredItems = useTemplateRef('transferredItems');
onClickOutside(main, () => {
  (desk as TransferListDesk).clearActive();
});
useSortable(availableItems, ctx!.available);
useSortable(transferredItems, ctx!.transferred);

const available = computed(() => ctx.available.value || []);
const transferred = computed(() => ctx.transferred.value || []);
const size = computed(() => ctx.size.value || 0);

const csv = computed(() => {
  const obj = ctx.toObject();
  return obj ? toCsv(obj || [], true, ',') : '';
});
const download = () => {
  const obj = ctx.toObject();
  if (obj) {
    downloadCsv(obj, 'transfer-list.csv', true, ',');
  }
};
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div ref="main" class="flex flex-col h-64 min-h-64 md:flex-row gap-4 md:gap-2">
      <div
        ref="availableItems"
        class="flex-1 flex flex-col p-2 border border-border rounded-md gap-1"
      >
        <Transferable v-for="item in available" :id="item.id" :key="item.id" />
      </div>
      <div
        ref="transferredItems"
        class="flex-1 flex flex-col p-2 border border-border rounded-md gap-1"
      >
        <Transferable v-for="item in transferred" :id="item.id" :key="item.id" />
      </div>
    </div>
    <Separator />
    <Accordion type="single" collapsible class="w-full">
      <AccordionItem :disabled="size === 0" value="content">
        <AccordionTrigger class="hover:no-underline"
          >Transferred Content - {{ transferred.length }} columns, {{ size }} rows</AccordionTrigger
        >
        <AccordionContent>
          <div class="w-full border border-border rounded-md">
            <table class="w-full border-collapse table-fixed">
              <thead class="sticky top-0">
                <tr>
                  <th
                    v-for="item in transferred"
                    :key="item.id"
                    class="font-bold uppercase p-2 border-b"
                  >
                    {{ item.name }}
                  </th>
                </tr>
              </thead>
            </table>
            <div class="max-h-64 md:max-h-128 overflow-auto">
              <table class="w-full border-collapse table-fixed">
                <tbody>
                  <tr v-for="(rowIndex, idx) in size" :key="`row-${String(idx)}`">
                    <td
                      v-for="item in transferred"
                      :key="`row-${rowIndex}-col-${item.id}`"
                      class="p-2 border-b text-center"
                    >
                      {{ item.data?.[rowIndex] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
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
