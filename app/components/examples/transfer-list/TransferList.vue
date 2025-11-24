<script setup lang="ts">
import { ref } from 'vue';
import { useCheckIn } from 'vue-airport';
import { createTransformValuePlugin } from '@vue-airport/plugins-base';
import { useTransferList, type TransferableItem } from './useTransferList';
import { useCsv } from './useCsv';
import { CsvFile } from './fixtures';
import { type TransferListContext, TransferListKey, Transferable } from '.';

import { Separator } from '@/components/ui/separator';

const { parse } = useCsv();
const { rows } = parse(CsvFile);

const transforms = ref({
  name: {
    fn: (value: string) => {
      const [firstname, lastname] = value.split(' ');
      return { firstname, lastname };
    },
  },
});

const plugins = [
  createTransformValuePlugin<TransferableItem>({
    name: transforms.value.name,
  }),
];

const { createDesk } = useCheckIn<TransferableItem, TransferListContext>();
const { desk } = createDesk(TransferListKey, {
  devTools: true,
  debug: false,
  plugins,
});
desk.setContext(useTransferList<TransferableItem, TransferListContext>(desk, rows));
const ctx = desk.getContext<TransferListContext>();

const available = computed(() => ctx?.available.value || []);
const transferred = computed(() => ctx?.transferred.value || []);
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex gap-2 h-64 min-h-64">
      <div class="flex-1 flex flex-col p-2 border border-border rounded-md gap-1">
        <Transferable v-for="item in available" :id="item.id" :key="item.id" />
      </div>
      <div class="flex-1 flex flex-col p-2 border border-border rounded-md gap-1">
        <Transferable v-for="item in transferred" :id="item.id" :key="item.id" />
      </div>
    </div>
    <Separator />
    <div class="text-lg font-bold">Available Transformations</div>
    <Separator />
    <div class="w-full border border-border rounded-md">
      <table class="w-full border-collapse table-fixed">
        <thead class="sticky top-0">
          <tr>
            <th
              v-for="header in transferred"
              :key="header.id"
              class="font-bold uppercase p-2 border-b"
            >
              {{ header.name }}
            </th>
          </tr>
        </thead>
      </table>
      <div class="max-h-128 overflow-auto">
        <table class="w-full border-collapse table-fixed">
          <tbody>
            <tr v-for="row in ctx?.data" :key="row.id">
              <td
                v-for="header in transferred"
                :key="`row-${row.id}-col-${header.id}`"
                class="p-2 border-b text-center"
              >
                {{ row[header.name] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
