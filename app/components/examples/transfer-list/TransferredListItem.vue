<template>
  <BaseListItem :label="header">
    <div class="flex items-center gap-2">
      <Badge variant="secondary">{{ transformLabel }}</Badge>
      <Button size="sm" variant="destructive" @click="onRemove">Retirer</Button>
    </div>
    <div class="mt-2">
      <Badge variant="outline">Valeurs</Badge>
      <ul class="ml-2 inline">
        <li v-for="(row, idx) in rows" :key="idx" class="inline-block mr-2">
          <span>{{ row[header] }}</span>
        </li>
      </ul>
    </div>
  </BaseListItem>
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import BaseListItem from './BaseListItem.vue';

defineProps<{
  header: string;
  transformLabel: string;
  rows: Array<Record<string, string>>;
  onRemove: () => void;
}>();
</script>
