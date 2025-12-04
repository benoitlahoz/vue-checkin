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
  <div data-slot="transform-param">
    <input
      v-if="config?.type === 'text'"
      v-model="localValue"
      :placeholder="config?.label"
      class="transform-param-input"
      @keydown="handleKeydown"
      @input="(e) => handleInput((e.target as HTMLInputElement).value)"
      @blur="handleBlur"
    />

    <input
      v-else-if="config?.type === 'number'"
      v-model.number="localValue"
      type="number"
      :placeholder="config?.label"
      class="transform-param-input"
      @keydown="handleKeydown"
      @input="(e) => handleInput(Number((e.target as HTMLInputElement).value), true)"
    />

    <div v-else-if="config?.type === 'boolean'" class="transform-param-checkbox">
      <input
        :id="`checkbox-${config?.label}`"
        type="checkbox"
        :checked="localValue"
        class="transform-param-checkbox-input"
        @change="(e) => handleInput((e.target as HTMLInputElement).checked, true)"
      />
      <label :for="`checkbox-${config?.label}`" class="transform-param-checkbox-label">
        {{ localValue ? 'true' : 'false' }}
      </label>
    </div>
  </div>
</template>

<style>
/* TransformParam styles - using ObjectNode variables */
.transform-param-input {
  height: 1.5rem;
  width: 100%;
  padding: 0 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  border: 1px solid var(--object-node-input-border);
  border-radius: 0.375rem;
  background-color: var(--object-node-input-bg);
  color: inherit;
  outline: none;
  transition-property: border-color, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  box-sizing: border-box;
}

.transform-param-input:focus {
  border-color: var(--object-node-input-ring);
  box-shadow: 0 0 0 3px oklch(from var(--object-node-input-ring) l c h / 0.1);
}

.transform-param-input::placeholder {
  color: var(--object-node-muted-foreground);
}

.transform-param-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.transform-param-checkbox-input {
  width: 1rem;
  height: 1rem;
  border: 1px solid var(--object-node-input-border);
  border-radius: 0.25rem;
  background-color: var(--object-node-input-bg);
  cursor: pointer;
  transition-property: border-color, background-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.transform-param-checkbox-input:checked {
  background-color: var(--object-node-primary);
  border-color: var(--object-node-primary);
}

.transform-param-checkbox-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px oklch(from var(--object-node-input-ring) l c h / 0.1);
}

.transform-param-checkbox-label {
  font-size: 0.75rem;
  line-height: 1rem;
  cursor: pointer;
  user-select: none;
}
</style>
