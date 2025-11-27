<script setup lang="ts">
import { useCsv } from './useCsv';
import { CsvFile } from './fixtures';
import { DesksProvider, TransferList, DataTable, DataTableCodec } from '.';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

const { fromCsv } = useCsv();
// const { rows } = fromCsv(CsvFile, true, ',');
const rows = ref<any[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);

const loadMock = () => {
  const { rows: newRows } = fromCsv(CsvFile, true, ',');
  rows.value = newRows;
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileUpload = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const { rows: newRows } = fromCsv(text, true, ';');
        rows.value = newRows;
      };
      reader.readAsText(file);
    }
  }
};
</script>

<template>
  <div>
    <div class="mb-4 flex gap-2">
      <Button @click="triggerFileInput">Load CSV</Button>
      <Button variant="outline" @click="loadMock">Load Mock Data</Button>
      <input
        ref="fileInputRef"
        type="file"
        accept=".csv"
        class="mb-2"
        style="display: none"
        @change="(e) => handleFileUpload(e)"
      />
    </div>
    <DesksProvider :data="rows">
      <TransferList />
      <Accordion>
        <DataTable />
      </Accordion>
      <DataTableCodec />
    </DesksProvider>
  </div>
</template>
