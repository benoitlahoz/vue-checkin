<script setup lang="ts">
import { ref, watch } from 'vue';

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

// Prevent keyboard events from bubbling up to parent components (like Select)
function handleKeydown(event: KeyboardEvent) {
  event.stopPropagation();
}
</script>

<template>
  <div
    data-slot="transform-param"
    :class="{ 'transform-param-checkbox-wrapper': config?.type === 'boolean' }"
  >
    <input
      v-if="config?.type === 'text'"
      v-model="localValue"
      :placeholder="config?.label"
      class="ot-param-input"
      @keydown="handleKeydown"
      @input="(e) => handleInput((e.target as HTMLInputElement).value)"
      @blur="handleBlur"
    />

    <input
      v-else-if="config?.type === 'number'"
      v-model.number="localValue"
      type="number"
      :placeholder="config?.label"
      class="ot-param-input"
      @keydown="handleKeydown"
      @input="(e) => handleInput(Number((e.target as HTMLInputElement).value), true)"
    />

    <input
      v-else-if="config?.type === 'boolean'"
      :id="`checkbox-${config?.label}`"
      type="checkbox"
      :checked="localValue"
      class="ot-param-checkbox"
      @change="(e) => handleInput((e.target as HTMLInputElement).checked, true)"
    />
  </div>
</template>

