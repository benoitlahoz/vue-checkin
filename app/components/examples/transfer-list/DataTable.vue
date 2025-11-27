<script setup lang="ts">
import { useTemplateRef, watch, computed, ref } from 'vue';
import { useSortable } from '@vueuse/integrations/useSortable';
import { useCheckIn } from '#vue-airport';
import { EncodedDataDeskKey, type TransferredDataItem } from '.';
import { watchOnce } from '@vueuse/core';

const colsRef = useTemplateRef('colsRef');

const { checkIn: checkInEncodedDataDesk } = useCheckIn<TransferredDataItem>();
const { desk } = checkInEncodedDataDesk(EncodedDataDeskKey, {
  watchData: true,
});

// Flat array of strings for useSortable.
const headers = ref<string[]>([]);
const size = computed(() => desk!.registryList.value.length || 0);

watch(
  () => desk!.registryList.value,
  (raw) => {
    if (!raw || raw.length === 0) {
      headers.value = [];
      return;
    }
    if (Array.isArray(raw) && typeof raw[0] === 'object') {
      headers.value = Object.keys(raw[0].data);
      return;
    }
    headers.value = [];
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
        const moved = headers.value.splice(oldIndex, 1)[0];
        headers.value.splice(newIndex, 0, moved!);
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
          <!-- une colonne par header -->
          <div v-for="header in headers" :key="header" class="flex flex-col border-r flex-1">
            <!-- handle -->
            <div
              class="p-2 border-b min-w-20 uppercase truncate font-bold flex items-center justify-center select-none cursor-move"
            >
              {{ header }}
            </div>
          </div>
        </div>
        <div class="w-full flex">
          <div v-for="header in headers" :key="header" class="flex flex-col border-r flex-1">
            <!-- rows pour ce header -->
            <div
              v-for="(row, rowIdx) in desk!.registryList.value"
              :key="header + '-row-' + rowIdx"
              class="p-2 border-b min-w-20 flex truncate items-center justify-center"
            >
              {{ row.data[header] }}
            </div>
          </div>
        </div>
      </div>
    </AccordionContent>
  </AccordionItem>
</template>
