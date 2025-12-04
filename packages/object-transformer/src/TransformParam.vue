<script setup lang="ts">
import { ref, watch } from 'vue';
import { Input } from './components/ui/input';
import { Checkbox } from './components/ui/checkbox';

export interface ParamConfig {
  type: 'text' | 'number' | 'boolean';
  label?: string;
  default?: any;
}

const props = defineProps<{
  modelValue: any;
  config?: ParamConfig;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: any];
  change: [];
}>();

// Local value for immediate UI updates
const localValue = ref(props.modelValue);

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Sync local value with prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue;
  }
);

// Watch local value changes and emit updates (WITHOUT triggering change event)
watch(localValue, (newValue) => {
  emit('update:modelValue', newValue);
});

function handleInput(value: any, immediate = false) {
  localValue.value = value;
  emit('update:modelValue', value);

  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  if (immediate) {
    // For booleans and numbers, apply immediately
    emit('change');
  } else {
    // For text inputs, debounce the change event
    debounceTimer = setTimeout(() => {
      emit('change');
    }, 300);
  }
}

// Handle blur for text inputs - emit change immediately
function handleBlur() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  emit('change');
}

// Handle number change - emit immediately
function handleNumberChange() {
  emit('change');
}

// Prevent keyboard events from bubbling up to parent components (like Select)
function handleKeydown(event: KeyboardEvent) {
  event.stopPropagation();
}
</script>

<template>
  <div data-slot="transform-param">
    <Input
      v-if="config?.type === 'text'"
      v-model="localValue"
      :placeholder="config?.label"
      class="h-6 px-2 py-0"
      style="font-size: var(--text-xs)"
      @keydown="handleKeydown"
      @blur="handleBlur"
    />

    <Input
      v-else-if="config?.type === 'number'"
      v-model="localValue"
      type="number"
      :placeholder="config?.label"
      class="h-6 px-2 py-0 text-xs"
      @keydown="handleKeydown"
      @change="handleNumberChange"
    />

    <div v-else-if="config?.type === 'boolean'" class="flex items-center gap-1">
      <Checkbox :checked="localValue" @update:checked="(v: boolean) => handleInput(v, true)" />
      <span class="text-xs">{{ localValue ? 'true' : 'false' }}</span>
    </div>
  </div>
</template>
