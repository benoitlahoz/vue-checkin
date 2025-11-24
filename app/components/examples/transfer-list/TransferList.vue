<script setup lang="ts">
import { ref } from 'vue';
import { useCheckIn } from 'vue-airport';
import { useTransferList, type TransferableItem } from './useTransferList';
import { type TransferListContext, TransferListKey, Transferable } from '.';
import { createTransformValuePlugin } from '@vue-airport/plugins-base';

import { Separator } from '@/components/ui/separator';

const MockCsv = `name,age,city\nJohn Doe,32,Paris\nJane Smith,28,Lyon\nAlice Cooper,40,Bordeaux`;
const { rows } = ((csv: string) => {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const headers = lines[0]!.split(',');
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(',');
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i]!;
    });
    return obj;
  });
  return { rows };
})(MockCsv);

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
    <div ref="mainContainer" class="flex gap-2 h-64 min-h-64">
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
        <thead>
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
        <tbody>
          <tr v-for="row in ctx?.data" :key="row.id">
            <td
              v-for="header in transferred"
              :key="`row-${row.id}-col-${header.id}`"
              class="p-2 border-b"
            >
              {{ row[header.name] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
