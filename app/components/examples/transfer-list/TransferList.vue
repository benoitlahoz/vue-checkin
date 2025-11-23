<script setup lang="ts">
import BaseListItem from './BaseListItem.vue';
import TransferredListItem from './TransferredListItem.vue';
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

function transferHeader(header: string, transform?: string) {
  if (!transferHeaders.value.includes(header)) {
    transferHeaders.value.push(header);
    selectedTransforms.value[header] = transform ?? '__none';
  }
}
function removeTransferredHeader(header: string) {
  transferHeaders.value = transferHeaders.value.filter((h) => h !== header);
  delete selectedTransforms.value[header];
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

const selectedHeader = ref<string | null>(null);
const selectedTransform = ref<string>('__none');

function addTransferHeader() {
  if (selectedHeader.value && !isTransferred(selectedHeader.value)) {
    transferHeader(selectedHeader.value, selectedTransform.value);
    selectedHeader.value = null;
    selectedTransform.value = '__none';
  }
}

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
    <!-- Barre d'ajout -->
    <div class="flex gap-3 mb-6 flex-wrap justify-between items-center">
      <div class="flex gap-2 items-center">
        <Select v-model="selectedHeader">
          <SelectTrigger class="input input-bordered min-w-[120px]">
            <SelectValue placeholder="Header à transférer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="header in availableHeaders"
              :key="header"
              :value="header"
              :disabled="isTransferred(header)"
            >
              <SelectItemText>{{ header }}</SelectItemText>
            </SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="selectedTransform">
          <SelectTrigger class="input input-bordered min-w-[180px]">
            <SelectValue placeholder="Transformation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none" disabled>Aucune transformation</SelectItem>
            <SelectItem
              v-for="t in availableTransforms[selectedHeader] || []"
              :key="t.key"
              :value="t.key"
            >
              <SelectItemText>{{ t.label }}</SelectItemText>
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          :disabled="!selectedHeader || isTransferred(selectedHeader)"
          @click="addTransferHeader"
        >
          <span class="mr-2">+</span>Transférer
        </Button>
      </div>
      <Badge variant="outline" class="border-primary bg-primary/20 text-primary px-3 py-1">
        {{ transferHeaders.length }} transférés
      </Badge>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Liste des headers disponibles à gauche -->
      <div class="p-4 bg-card border border-muted rounded-md flex-1">
        <h3 class="mb-2">Headers disponibles</h3>
        <ul class="list-none p-0 m-0 flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          <BaseListItem v-for="header in availableHeaders" :key="header" :label="header">
            <Button size="sm" :disabled="isTransferred(header)" @click="transferHeader(header)">
              Transférer
            </Button>
          </BaseListItem>
        </ul>
      </div>
      <!-- Liste des headers transférés à droite -->
      <div class="p-4 bg-card border border-muted rounded-md flex-1">
        <h3 class="mb-2">Headers transférés</h3>
        <ul class="list-none p-0 m-0 flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          <TransferredListItem
            v-for="header in transferHeaders"
            :key="header"
            :header="header"
            :transform-label="
              selectedTransforms[header] === '__none'
                ? 'Aucune'
                : availableTransforms[header]?.find((t) => t.key === selectedTransforms[header])
                    ?.label || 'Aucune'
            "
            :rows="rows"
            :on-remove="() => removeTransferredHeader(header)"
          />
          <!-- Transformation select inline (optionnel) -->
          <Field v-for="header in transferHeaders" :key="header + '-select'">
            <Label>Transformation</Label>
            <Select v-model="selectedTransforms[header]">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Transformation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none" disabled>Aucune transformation</SelectItem>
                <SelectItem v-for="t in availableTransforms[header]" :key="t.key" :value="t.key">
                  <SelectItemText>{{ t.label }}</SelectItemText>
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </ul>
        <Button class="mt-4" :disabled="!transferHeaders.length" @click="applyTransformsToHeaders">
          Appliquer les transformations
        </Button>
      </div>
    </div>

    <Separator class="my-6" />
    <div v-if="transformedRows.length">
      <h3 class="mb-2">Données transformées</h3>
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
