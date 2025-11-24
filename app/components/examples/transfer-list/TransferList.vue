<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useCheckIn } from 'vue-airport';
import {
  type TransferListItem,
  type TransferListContext,
  type TransferListDesk,
  TransferListKey,
} from '.';
import { createActiveItemPlugin, createTransformValuePlugin } from '@vue-airport/plugins-base';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const MockCsv = `name,age,city\nJohn Doe,32,Paris\nJane Smith,28,Lyon\nAlice Cooper,40,Bordeaux`;
const lines = MockCsv.split(/\r?\n/).filter(Boolean);
const headers = lines[0]!.split(',');
const rows = lines.slice(1).map((line) => {
  const cols = line.split(',');
  const obj: Record<string, string> = {};
  headers.forEach((h, i) => {
    obj[h] = cols[i]!;
  });
  return obj;
});

const selectedTransforms = ref<Record<string, string>>({});

const transforms = ref({
  name: {
    fn: (value: string) => {
      const [firstname, lastname] = value.split(' ');
      return { firstname, lastname };
    },
  },
});

const plugins = [
  createTransformValuePlugin<TransferListItem>({
    name: transforms.value.name,
  }),
  createActiveItemPlugin<TransferListItem>(),
];

const { createDesk } = useCheckIn<TransferListItem, TransferListContext>();
const { desk } = createDesk(TransferListKey, {
  devTools: true,
  debug: false,
  plugins,
  context: {
    available: ref(headers.map((r, index) => ({ id: `item-${index + 1}`, name: r }))),
    transferred: ref([]),
  },
});

const deskWithPlugins = desk as TransferListDesk;

const mainContainer = useTemplateRef<HTMLElement>('mainContainer');
onClickOutside(mainContainer, () => {
  console.log('Clearing active item');
  const deskWithPlugins = desk as typeof desk & TransferListDesk;
  deskWithPlugins.clearActive();
});

const availableItems = computed(() => {
  return desk.getContext<TransferListContext>()?.available.value || [];
});
const transferredItems = computed(
  () => desk.getContext<TransferListContext>()?.transferred.value || []
);

onMounted(() => {
  const ctx = desk.getContext<TransferListContext>();
  for (const item of ctx?.available.value || []) {
    desk.checkIn(item.id, item);
  }
});

const hasActiveInAvailable = computed(() => {
  const ctx = desk.getContext<TransferListContext>();
  const activeId = (desk as typeof desk & TransferListDesk).activeId?.value;
  return ctx?.available.value.some((item) => item.id === activeId);
});

const hasActiveInTransferred = computed(() => {
  const ctx = desk.getContext<TransferListContext>();
  const activeId = (desk as typeof desk & TransferListDesk).activeId?.value;
  return ctx?.transferred.value.some((item) => item.id === activeId);
});

const transfer = () => {
  const ctx = desk.getContext<TransferListContext>();
  const activeId = (desk as typeof desk & TransferListDesk).activeId?.value;
  if (!activeId) return;

  const availableIndex = ctx?.available.value.findIndex((item) => item.id === activeId);
  if (availableIndex !== -1 && availableIndex !== undefined) {
    const [item] = ctx!.available.value.splice(availableIndex, 1);
    if (item) ctx!.transferred.value.push(item);
    deskWithPlugins.clearActive();
    return;
  }
};

const retrieve = () => {
  const ctx = desk.getContext<TransferListContext>();
  const activeId = (desk as typeof desk & TransferListDesk).activeId?.value;
  if (!activeId) return;

  const transferredIndex = ctx?.transferred.value.findIndex((item) => item.id === activeId);
  if (transferredIndex !== -1 && transferredIndex !== undefined) {
    const [item] = ctx!.transferred.value.splice(transferredIndex, 1);
    if (item) ctx!.available.value.push(item);
    deskWithPlugins.clearActive();
    return;
  }
};

const transferredHeaders = computed(() => {
  const ctx = desk.getContext<TransferListContext>();
  if (!ctx || ctx?.transferred.value.length === 0) return [];
  return ctx?.transferred.value.map((item) => item.name);
});

const transferredData = computed(() => {
  const headersValue = transferredHeaders.value;
  if (headersValue.length === 0) return [];
  const dataRows = rows.map((row, index) => {
    const obj: Record<string, string | number> = { id: `row-${index + 1}` };
    for (const header of headersValue) {
      obj[header] = row[header]!;
    }
    return obj;
  });
  console.log('transferredData', dataRows);
  return dataRows;
});
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div ref="mainContainer" class="flex gap-2">
      <div class="flex-1 flex flex-col p-2 border border-border rounded-md gap-1">
        <TransferListItem v-for="item in availableItems" :id="item.id" :key="item.id" />
      </div>
      <div>
        <div class="flex flex-col h-full justify-center gap-2">
          <Button size="sm" :disabled="!hasActiveInAvailable" @click="transfer">→</Button>
          <Button size="sm" :disabled="!hasActiveInTransferred" @click="retrieve">←</Button>
        </div>
      </div>
      <div class="flex-1 flex flex-col p-2 border border-border rounded-md gap-1">
        <TransferListItem v-for="item in transferredItems" :id="item.id" :key="item.id" />
      </div>
    </div>
    <Separator />
    <div class="border border-border rounded-md">
      <table>
        <thead>
          <tr>
            <th v-for="header in transferredHeaders" :key="header">
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in transferredData" :key="row.id">
            <td v-for="(col, index) in row" :key="`rox-${row.id}-col-${index}`">
              {{ col }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
