<script setup lang="ts">
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { type FieldData, FORM_DESK_KEY } from '.';

/**
 * Form Field Component
 *
 * Individual form field that automatically checks in to the form desk
 * and watches value changes for validation.
 */

const props = defineProps<{
  id: string | number;
  label: string;
  value: string;
  type: 'text' | 'email' | 'number';
  required: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  'update:value': [value: string];
}>();

// Local value that syncs with prop
const localValue = ref(props.value);

// Sync local value with prop changes
watch(
  () => props.value,
  (newValue) => {
    localValue.value = newValue;
  }
);

// Update local value and emit
const handleInput = (value: string | number) => {
  // Convert to string to avoid type mismatch warnings
  const stringValue = String(value);
  localValue.value = stringValue;
  emit('update:value', stringValue);
};

// Check in to the desk with watchData on local value
useCheckIn<FieldData>().checkIn(FORM_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: () => ({
    label: props.label,
    value: localValue.value,
    type: props.type,
    required: props.required,
  }),
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="String(props.id)" class="font-medium text-gray-900 dark:text-gray-100">
      {{ props.label }}
      <span v-if="props.required" class="text-red-500">*</span>
    </label>
    <UInput
      :id="String(props.id)"
      :model-value="localValue"
      :type="props.type"
      :placeholder="`Enter ${props.label.toLowerCase()}`"
      @update:model-value="handleInput"
    />
    <span v-if="props.error" class="text-red-500 text-sm">
      {{ props.error }}
    </span>
  </div>
</template>

<style scoped></style>
