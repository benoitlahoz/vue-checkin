<script setup lang="ts">
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { type FieldData, FORM_DESK_KEY, type FormContext } from '.';
import { Input } from '@/components/ui/input';
import { Field, FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field';

/**
 * Form Field Component
 *
 * Individual form field that automatically checks in to the form desk
 * and watches value changes for validation.
 */

const props = defineProps<{
  id: string;
}>();

// Check in to the desk with watchData
const { checkIn } = useCheckIn<FieldData, FormContext>();
const { desk } = checkIn(FORM_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: (desk) => {
    const field = desk.fieldData?.value?.find((f) => f.id === props.id);
    return {
      id: props.id,
      label: field?.label || '',
      value: field?.value || '',
      type: field?.type || 'text',
      required: field?.required,
      touched: field?.touched || false,
    };
  },
});

// Get field data from context
const fieldData = computed(() => {
  return desk?.fieldData?.value.find((f) => f.id === props.id);
});

const errorMessage = computed<string | undefined>(() => {
  if (fieldData.value?.touched) {
    return desk?.errorById(props.id)?.message;
  }
  return undefined;
});
// Function to update both the field value and hte local value
const updateFieldValue = (value: string | number) => {
  const stringValue = String(value);

  const error = desk?.errorById(props.id);
  // Update the desk
  desk?.update(props.id, { value: stringValue, touched: true, error });

  // ALSO update the fieldData in context to keep it in sync
  if (fieldData.value) {
    fieldData.value.value = stringValue;
    fieldData.value.touched = true;
  }
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <FieldSet>
      <FieldLegend :for="String(props.id)">
        {{ fieldData?.label }}
        <span v-if="fieldData?.required" class="text-red-500 text-xs">*</span>
      </FieldLegend>
      <FieldDescription class="text-sm text-gray-500 dark:text-gray-400 mb-1">
        Please enter your {{ fieldData?.label.toLowerCase() }}.
      </FieldDescription>
      <Field>
        <Input
          :id="String(props.id)"
          :model-value="fieldData?.value"
          :type="fieldData?.type || 'text'"
          :placeholder="`Enter ${fieldData?.label.toLowerCase()}`"
          @update:model-value="updateFieldValue"
        />
        <span v-if="errorMessage" class="text-red-500 text-sm">
          {{ errorMessage }}
        </span>
      </Field>
    </FieldSet>
  </div>
</template>
