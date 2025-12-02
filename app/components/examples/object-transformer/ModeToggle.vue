<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import { Button } from '@/components/ui/button';
import { type ObjectNodeData, type ObjectTransformerContext, ObjectTransformerDeskKey } from '.';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);
const deskWithContext = desk as DeskWithContext;

const mode = computed(() => deskWithContext.mode.value);
const templateIndex = computed(() => deskWithContext.templateIndex.value);
const isArray = computed(() => Array.isArray(deskWithContext.originalData.value));
const arrayLength = computed(() =>
  isArray.value ? (deskWithContext.originalData.value as any[]).length : 0
);

const setMode = (newMode: 'object' | 'model') => {
  deskWithContext.setMode(newMode);
};

const setTemplateIndex = (index: number) => {
  deskWithContext.setTemplateIndex(index);
};
</script>

<template>
  <div class="flex flex-col gap-2 p-2 border rounded-md bg-muted/30">
    <!-- Mode Toggle -->
    <div class="flex gap-2 items-center">
      <span class="text-xs font-semibold text-muted-foreground">Mode:</span>
      <div class="flex gap-1">
        <Button
          size="sm"
          :variant="mode === 'object' ? 'default' : 'outline'"
          @click="setMode('object')"
        >
          Object
        </Button>
        <Button
          size="sm"
          :variant="mode === 'model' ? 'default' : 'outline'"
          :disabled="!isArray"
          @click="setMode('model')"
        >
          Model
        </Button>
      </div>
    </div>

    <!-- Template Selector (only in model mode with array) -->
    <div v-if="mode === 'model' && isArray" class="flex gap-2 items-center">
      <span class="text-xs font-semibold text-muted-foreground">Template:</span>
      <select
        :value="templateIndex"
        class="text-xs px-2 py-1 border rounded"
        @change="(e) => setTemplateIndex(Number((e.target as HTMLSelectElement).value))"
      >
        <option v-for="i in arrayLength" :key="i - 1" :value="i - 1">
          Object {{ i - 1 }} {{ i - 1 === templateIndex ? '(current)' : '' }}
        </option>
      </select>
    </div>

    <!-- Info -->
    <div class="text-xs text-muted-foreground">
      <span v-if="mode === 'object'"> Transform complete data structure </span>
      <span v-else-if="mode === 'model'">
        Define transformations on template (Object {{ templateIndex }})
      </span>
    </div>
  </div>
</template>
