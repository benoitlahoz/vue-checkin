<script setup lang="ts">
import { useCheckIn, createValidationPlugin } from '#vue-airport/composables/useCheckIn';
import type { ValidationError } from '#vue-airport/plugins/validation';
import FormField from './FormField.vue';
import { type FieldData, FORM_DESK_KEY } from '.';

/**
 * Form Example - Validation Plugin
 *
 * Demonstrates:
 * - Custom validation plugin
 * - Form field validation
 * - Real-time validation feedback
 * - Form submission with validation
 * - Error cache management
 */

// Create custom validation plugin
const validationPlugin = createValidationPlugin<FieldData>({
  validate: (data: FieldData) => {
    // Check if required field is filled
    if (data.required && !data.value) {
      return 'This field is required';
    }

    // Validate email format
    if (data.type === 'email' && data.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.value)) {
        return 'Invalid email';
      }
    }

    // Validate age if provided
    if (data.type === 'number' && data.value) {
      const age = Number(data.value);
      if (isNaN(age) || age < 18 || age > 120) {
        return 'Age must be a number between 18 and 120';
      }
    }
    return true; // No errors
  },
  maxErrors: 100, // Keep up to 100 validation errors
});

// Create a desk with validation plugin
const { createDesk } = useCheckIn<FieldData>();
const { desk } = createDesk(FORM_DESK_KEY, {
  devTools: true,
  debug: false,
  plugins: [validationPlugin],
});

// Extend desk type to include validation plugin methods
type DeskWithValidation = typeof desk & {
  getValidationErrors?: () => ValidationError[];
  getLastValidationError?: () => ValidationError | null;
  getValidationErrorsById?: (id: string | number) => ValidationError[];
  clearValidationErrors?: () => void;
  getValidationErrorsByType?: (type: ValidationError['type']) => ValidationError[];
  validationErrorCount?: number;
  hasValidationErrors?: boolean;
  count?: number;
};

const validatedDesk = desk as DeskWithValidation;

// Form fields state
const fieldsData = ref<
  Array<{
    id: string;
    label: string;
    value: string;
    type: 'text' | 'email' | 'number';
    required: boolean;
  }>
>([
  {
    id: 'name',
    label: 'Name',
    value: '',
    type: 'text',
    required: true,
  },
  {
    id: 'email',
    label: 'Email',
    value: '',
    type: 'email',
    required: true,
  },
  {
    id: 'age',
    label: 'Age',
    value: '',
    type: 'number',
    required: false,
  },
]);

// Track which fields have been touched
const touchedFields = ref<Set<string>>(new Set());

// Computed properties for validation
const validationErrors = computed(() => validatedDesk.getValidationErrors?.() || []);

// Get current errors by field ID - only show errors for touched fields
const errors = computed(() => {
  const errorMap: Record<string, string> = {};
  validationErrors.value.forEach((error: ValidationError) => {
    if (touchedFields.value.has(String(error.id)) && !errorMap[error.id]) {
      errorMap[error.id] = error.message;
    }
  });
  return errorMap;
});

// Check if form is valid (all fields filled and no validation errors)
const isFormValid = computed(() => {
  // Check if all required fields have values
  const allRequiredFilled = fieldsData.value
    .filter((f) => f.required)
    .every((f) => f.value.trim() !== '');

  // Check if there are NO validation errors at all
  const noValidationErrors = validationErrors.value.length === 0;

  return allRequiredFilled && noValidationErrors;
});

// Function to update field value
const updateFieldValue = (id: string, value: string) => {
  // Mark field as touched
  touchedFields.value.add(id);

  const field = fieldsData.value.find((f) => f.id === id);
  if (field) {
    field.value = value;
  }
};

// Function to submit the form
const submitForm = () => {
  if (isFormValid.value) {
    const formData = fieldsData.value.reduce(
      (acc, field) => {
        acc[field.id] = field.value;
        return acc;
      },
      {} as Record<string, string>
    );

    alert('Form submitted successfully!\n\n' + JSON.stringify(formData, null, 2));

    // Clear validation errors after successful submission
    validatedDesk.clearValidationErrors?.();
  } else {
    const errorList = validationErrors.value
      .map((e: ValidationError) => `- ${e.message}`)
      .join('\n');
    alert('The form contains errors. Please correct them:\n\n' + errorList);
  }
};

// Function to reset the form
const resetForm = () => {
  fieldsData.value.forEach((field) => {
    field.value = '';
  });

  // Clear touched fields
  touchedFields.value.clear();

  // Clear validation errors when resetting
  validatedDesk.clearValidationErrors?.();
};
</script>

<template>
  <div>
    <form class="flex flex-col gap-6" @submit.prevent="submitForm">
      <FormField
        v-for="field in fieldsData"
        :id="field.id"
        :key="field.id"
        :label="field.label"
        :value="field.value"
        :type="field.type"
        :required="field.required"
        :error="errors[field.id]"
        @update:value="updateFieldValue(field.id, $event)"
      />

      <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <UButton type="submit" icon="i-heroicons-check" :disabled="!isFormValid"> Submit </UButton>
        <UButton type="button" variant="soft" icon="i-heroicons-arrow-path" @click="resetForm">
          Reset
        </UButton>
      </div>

      <div class="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
        <UBadge :color="isFormValid ? 'success' : 'error'">
          {{ isFormValid ? '✓ Valid form' : '✗ Invalid form' }}
        </UBadge>
        <span
          v-if="Object.keys(errors).length > 0"
          class="text-sm text-gray-600 dark:text-gray-400"
        >
          {{ Object.keys(errors).length }} error(s)
        </span>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
