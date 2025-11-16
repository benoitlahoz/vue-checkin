<script setup lang="ts">
import { useCheckIn, type CheckInDesk } from '@/vue-checkin/composables/useCheckIn';

interface FormField {
  label: string;
  value: string;
  type: 'text' | 'email' | 'number';
  required: boolean;
}

const props = defineProps<{
  id: string | number;
  label: string;
  value: string;
  type: 'text' | 'email' | 'number';
  required: boolean;
  error?: string;
  desk: CheckInDesk<FormField>;
}>();

const emit = defineEmits<{
  'update:value': [value: string];
}>();

// Auto check-in avec watch des données
useCheckIn<FormField>().checkIn(props.desk, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: () => ({
    label: props.label,
    value: props.value,
    type: props.type,
    required: props.required,
  }),
});
</script>

<template>
  <div class="form-field">
    <label :for="String(props.id)" class="label">
      {{ props.label }}
      <span v-if="props.required" class="required">*</span>
    </label>
    <UInput
      :id="String(props.id)"
      :model-value="props.value"
      :type="props.type"
      :placeholder="`Entrez ${props.label.toLowerCase()}`"
      @update:model-value="emit('update:value', $event)"
    />
    <span v-if="props.error" class="error">
      {{ props.error }}
    </span>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-weight: 500;
  color: var(--ui-text-primary);
}

.required {
  color: var(--ui-error);
}

.error {
  color: var(--ui-error);
  font-size: 0.875rem;
}
</style>
