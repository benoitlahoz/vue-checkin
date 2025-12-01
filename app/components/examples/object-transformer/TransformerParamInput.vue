<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export interface ParamConfig {
  type: 'text' | 'number' | 'boolean';
  label?: string;
  default?: any;
}

defineProps<{
  modelValue: any;
  config?: ParamConfig;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: any];
  change: [];
}>();

function handleInput(value: any) {
  emit('update:modelValue', value);
  emit('change');
}
</script>

<template>
  <div>
    <Input
      v-if="config?.type === 'text'"
      :model-value="modelValue"
      :placeholder="config?.label"
      class="h-6.5 px-2 py-0"
      style="font-size: var(--text-xs)"
      @input="handleInput(($event.target as HTMLInputElement).value)"
    />

    <Input
      v-else-if="config?.type === 'number'"
      :model-value="modelValue"
      type="number"
      :placeholder="config?.label"
      class="h-6.5 px-2 py-0 text-xs"
      @input="handleInput(parseFloat(($event.target as HTMLInputElement).value))"
    />

    <div v-else-if="config?.type === 'boolean'" class="flex items-center gap-1">
      <Checkbox :checked="modelValue" @update:checked="handleInput" />
      <span class="text-xs">{{ modelValue ? 'true' : 'false' }}</span>
    </div>
  </div>
</template>
