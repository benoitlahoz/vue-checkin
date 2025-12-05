<script setup lang="ts">
import { computed } from 'vue';
import type {
  TransformerMode,
  ObjectTransformerContext,
  ObjectTransformerDesk,
} from '@vue-airport/object-transformer';
import { Button } from '@/components/ui/button';
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
const isObjectModeAvailable = computed(() => desk.value?.isObjectModeAvailable.value ?? false);
const isModelModeAvailable = computed(() => desk.value?.isModelModeAvailable.value ?? false);
const arrayLength = computed(() =>
  Array.isArray(desk.value?.originalData.value)
    ? (desk.value?.originalData.value as any[]).length
    : 0
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
          :disabled="!isObjectModeAvailable"
          @click="setMode('object')"
        >
          Object
        </Button>
        <Button
          size="sm"
          :variant="mode === 'model' ? 'default' : 'outline'"
          :disabled="!isModelModeAvailable"
          @click="setMode('model')"
        >
          Model
        </Button>
      </div>
    </Field>

    <!-- Template Selector (only in model mode with array) -->
    <Field v-if="mode === 'model' && isModelModeAvailable">
      <FieldLabel class="text-sm">Template</FieldLabel>
      <div class="flex items-center gap-2">
        <input
          type="number"
          :value="templateIndex"
          :min="0"
          :max="arrayLength - 1"
          class="w-24 h-8 px-2 text-xs rounded-md border border-input bg-background"
          @input="(e) => setTemplateIndex(Number((e.target as HTMLInputElement).value))"
        />
        <span class="text-xs text-muted-foreground">/ {{ arrayLength - 1 }}</span>
      </div>
    </Field>
  </div>
</template>
