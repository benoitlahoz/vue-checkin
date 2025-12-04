<script setup lang="ts">
import { computed } from 'vue';
import type {
  TransformerMode,
  ObjectTransformerContext,
  ObjectTransformerDesk,
} from '@vue-airport/object-transformer';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';

interface Props {
  desk: ObjectTransformerDesk;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

const desk = computed(() => props.desk as ObjectTransformerContext | undefined);

const mode = computed(() => desk.value?.mode.value);
const templateIndex = computed(() => desk.value?.templateIndex.value);
const isArray = computed(() => Array.isArray(desk.value?.originalData.value));
const arrayLength = computed(() =>
  isArray.value ? (desk.value?.originalData.value as any[]).length : 0
);

const setMode = (newMode: TransformerMode) => {
  desk.value?.setMode(newMode);
};

const setTemplateIndex = (index: number) => {
  desk.value?.setTemplateIndex(index);
};
</script>

<template>
  <div class="flex gap-4 p-2 border rounded-md bg-muted/30" :class="props.class">
    <!-- Mode Toggle -->
    <Field>
      <FieldLabel class="text-sm">Mode</FieldLabel>
      <div class="flex gap-4">
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
    </Field>

    <!-- Template Selector (only in model mode with array) -->
    <Field v-if="mode === 'model' && isArray">
      <FieldLabel class="text-sm">Template</FieldLabel>
      <Select
        :model-value="String(templateIndex)"
        @update:model-value="(val) => setTemplateIndex(Number(val))"
      >
        <SelectTrigger class="w-32 text-xs h-8">
          <SelectValue placeholder="Select template" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="i in arrayLength" :key="i - 1" :value="String(i - 1)">
            Object {{ i - 1 }}
          </SelectItem>
        </SelectContent>
      </Select>
    </Field>
  </div>
</template>
