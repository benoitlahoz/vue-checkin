<script setup lang="ts">
import { useTemplateRef, watch, computed, ref } from 'vue';
import { watchOnce } from '@vueuse/core';
import { useSortable } from '@vueuse/integrations/useSortable';
import { useCheckIn } from '#vue-airport';
import { EncodedDataDeskKey, type TransferDataContext, type TransferredDataItem } from '.';

const colsRef = useTemplateRef('colsRef');

type TransferDeskWithContext = typeof desk & TransferDataContext;

const { checkIn: checkInEncodedDataDesk } = useCheckIn<TransferredDataItem>();
const { desk } = checkInEncodedDataDesk(EncodedDataDeskKey, {
  watchData: true,
});

const registry = computed(() => desk!.registryList.value || []);
const size = computed(() => desk!.registryList.value.length || 0);
const keysOrder = computed(
  () => (desk as TransferDeskWithContext).getContext<TransferDataContext>()?.keysOrder.value || []
);
// Flat array of strings for useSortable.
const headers = ref<string[]>([]);

watch(
  () => keysOrder.value,
  () => {
    headers.value = [...keysOrder.value];
    console.log('DataTable', keysOrder.value, headers.value);
  },
  { immediate: true }
);

watchOnce(
  () => colsRef.value,
  () => {
    useSortable(colsRef, headers, {
      onUpdate(event: any) {
        const oldIndex = event.oldIndex;
        const newIndex = event.newIndex;
        if (oldIndex === newIndex) return;

        headers.value.splice(newIndex, 0, headers.value.splice(oldIndex, 1)[0]!);
        const ctx = (desk as TransferDeskWithContext).getContext<TransferDataContext>();
        ctx!.updateKeysOrder(headers.value);
      },
    });
  }
);
</script>

<template>
  <AccordionItem :disabled="size === 0" value="content">
    <AccordionTrigger class="hover:no-underline">
      Transferred Content — {{ headers.length }} columns, {{ size }} rows
    </AccordionTrigger>

    <AccordionContent>
      <div
        class="w-full h-128 max-h-128 border border-border rounded-md overflow-auto flex flex-col"
      >
        <div ref="colsRef" class="w-full flex">
          <div
            v-for="(header, headerIdx) in headers"
            :key="`header-base-${header}-${headerIdx}`"
            class="flex flex-col border-r flex-1"
          >
            <div
              class="p-2 border-b uppercase truncate font-bold flex items-center justify-center select-none cursor-move"
            >
              {{ header }}
            </div>
          </div>
        </div>
        <div class="w-full flex">
          <div
            v-for="(header, headerIdx) in headers"
            :key="`header-${header}-content-${headerIdx}`"
            class="flex flex-col border-r flex-1"
          >
            <div
              v-for="(row, rowIdx) in registry"
              :key="header + '-row-' + rowIdx + headerIdx"
              class="p-2 border-b flex truncate items-center justify-center"
            >
              {{ row.data[header] }}
            </div>
          </div>
        </div>
      </div>
    </AccordionContent>
  </AccordionItem>
</template>
