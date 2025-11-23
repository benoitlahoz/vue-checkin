<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Mocked CSV with headers
const MOCK_CSV = `name,age,city\nJohn Doe,32,Paris\nJane Smith,28,Lyon\nAlice Cooper,40,Bordeaux`;

// Parse CSV
function parseCsv(csv: string) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(',');
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i];
    });
    return obj;
  });
  return { headers, rows };
}

const { headers, rows } = parseCsv(MOCK_CSV);
const availableHeaders = ref<string[]>(headers);
const transferHeaders = ref<string[]>([]);
const selectedTransforms = ref<Record<string, string>>({});

function transferHeader(header: string) {
  if (!transferHeaders.value.includes(header)) {
    transferHeaders.value.push(header);
    selectedTransforms.value[header] = '__none';
  }
}
function isTransferred(header: string) {
  return transferHeaders.value.includes(header);
}

// Available transforms for each header
const availableTransforms: Record<
  string,
  Array<{ key: string; label: string; fn: (value: string) => Record<string, any> }>
> = {
  name: [
    {
      key: 'splitName',
      label: 'Split into firstname/lastname',
      fn: (value: string) => {
        const [firstname, lastname] = value.split(' ');
        return { firstname, lastname };
      },
    },
  ],
  age: [],
  city: [],
};

const transformedRows = ref<Array<Record<string, any>>>([]);

function applyTransformsToHeaders() {
  transformedRows.value = rows.map((row) => {
    const result: Record<string, any> = {};
    for (const header of transferHeaders.value) {
      const transformKey = selectedTransforms.value[header];
      if (transformKey && transformKey !== '__none') {
        const transform = availableTransforms[header]?.find((t) => t.key === transformKey);
        if (transform) {
          Object.assign(result, transform.fn(row[header]));
        }
      } else {
        result[header] = row[header];
      }
    }
    return result;
  });
}
</script>

<template>
  <div class="transfer-list-example">
    <h2 class="mb-4">Transfer List Example</h2>
    <div class="flex gap-8">
      <!-- Available headers -->
      <div class="flex-1">
        <h3 class="mb-2">Available Headers</h3>
        <ul class="bg-muted rounded p-2">
          <li
            v-for="header in availableHeaders"
            :key="header"
            class="flex items-center justify-between py-1"
          >
            <span class="font-mono">{{ header }}</span>
            <Button size="sm" :disabled="isTransferred(header)" @click="transferHeader(header)"
              >Transfer</Button
            >
          </li>
        </ul>
      </div>
      <Separator orientation="vertical" class="mx-2" />
      <!-- Transfer list -->
      <div class="flex-1">
        <h3 class="mb-2">Transfer List</h3>
        <ul class="bg-muted rounded p-2">
          <li v-for="header in transferHeaders" :key="header" class="mb-4">
            <Field>
              <Label>{{ header }}</Label>
              <Select v-model="selectedTransforms[header]">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select transform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none" disabled>No transform</SelectItem>
                  <SelectItem v-for="t in availableTransforms[header]" :key="t.key" :value="t.key">
                    <SelectItemText>{{ t.label }}</SelectItemText>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div class="mt-2">
              <Badge variant="outline">Values</Badge>
              <ul class="ml-2 inline">
                <li v-for="(row, idx) in rows" :key="idx" class="inline-block mr-2">
                  <span>{{ row[header] }}</span>
                </li>
              </ul>
            </div>
          </li>
        </ul>
        <Button class="mt-4" :disabled="!transferHeaders.length" @click="applyTransformsToHeaders"
          >Apply Transforms</Button
        >
      </div>
    </div>
    <Separator class="my-6" />
    <div v-if="transformedRows.length">
      <h3 class="mb-2">Transformed Data</h3>
      <ul class="bg-muted rounded p-2">
        <li v-for="(row, idx) in transformedRows" :key="idx" class="mb-2">
          <span v-for="(value, key) in row" :key="key" class="mr-4">
            <Badge variant="secondary">{{ key }}</Badge>
            <span class="font-mono">{{ value }}</span>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.transfer-list-example {
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: var(--background-muted, #f8f9fa);
}
.transfer-list-example h2 {
  margin-bottom: 1rem;
}
.transfer-list-example ul {
  list-style: none;
  padding: 0;
}
.transfer-list-example li {
  margin-bottom: 0.5rem;
}
.transfer-list-example button {
  margin-left: 1rem;
}
</style>
