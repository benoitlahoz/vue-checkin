<script setup lang="ts">
import { useCheckIn } from '#vue-airport';
import { createValidationPlugin, type ValidationError } from '@vue-airport/plugins-validation';
import {
  type DeskWithValidation,
  type FieldData,
  FORM_DESK_KEY,
  type FormContext,
  FormField,
} from '.';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FieldSeparator, FieldGroup } from '@/components/ui/field';

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
      if (!emailRegex.test(String(data.value))) {
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

// Form fields state
const fieldData = ref<Array<FieldData>>([
  {
    id: 'name',
    label: 'Name',
    value: '',
    type: 'text',
    required: true,
    touched: false,
  },
  {
    id: 'email',
    label: 'Email',
    value: '',
    type: 'email',
    required: true,
    touched: false,
  },
  {
    id: 'age',
    label: 'Age',
    value: '',
    type: 'number',
    required: false,
    touched: false,
  },
]);

// Create a desk with validation plugin
const { createDesk } = useCheckIn<FieldData, FormContext>();
const { desk } = createDesk(FORM_DESK_KEY, {
  devTools: true,
  debug: false,
  plugins: [validationPlugin],
  context: {
    fieldData,
    errorById: (id: string) => {
      const allErrors = (desk as DeskWithValidation)?.getValidationErrors?.() || [];
      return allErrors.find((e: ValidationError) => e.id === id);
    },
  },
});

// Computed properties for validation
const validationErrors = computed(() => {
  return (desk as DeskWithValidation).getValidationErrors?.() || [];
});

// Check if form is valid (all fields filled and no validation errors)
const isFormValid = computed(() => {
  // Check if all required fields have values
  const allRequiredFilled = fieldData.value
    .filter((f) => f.required)
    .every((f) => String(f.value).trim() !== '');

  // Check if there are NO validation errors at all
  const noValidationErrors = validationErrors.value.length === 0;

  return allRequiredFilled && noValidationErrors;
});

// Function to submit the form
const submitForm = () => {
  if (isFormValid.value) {
    const formData = fieldData.value.reduce(
      (acc, field) => {
        acc[field.id] = String(field.value);
        return acc;
      },
      {} as Record<string, string>
    );

    alert('Form submitted successfully!\n\n' + JSON.stringify(formData, null, 2));

    // Clear validation errors after successful submission
    (desk as DeskWithValidation).clearValidationErrors?.();
  } else {
    const errorList = validationErrors.value
      .map((e: ValidationError) => `- ${e.message}`)
      .join('\n');
    alert('The form contains errors. Please correct them:\n\n' + errorList);
  }
};

// Function to reset the form
const resetForm = () => {
  fieldData.value.forEach((field) => {
    field.value = '';
    field.touched = false;
  });

  // Clear validation errors when resetting
  (desk as DeskWithValidation).clearValidationErrors?.();
};
</script>

<template>
  <div>
    <form class="flex flex-col gap-6" @submit.prevent="submitForm">
      <FieldGroup>
        <FormField v-for="field in fieldData" :id="field.id" :key="field.id" />
        <FieldSeparator />
      </FieldGroup>
      <div class="flex gap-3">
        <Button :disabled="!isFormValid">
          <UIcon name="i-heroicons-check" class="w-4 h-4" />
          Submit
        </Button>
        <Button variant="outline" @click="resetForm">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
          Reset
        </Button>
      </div>

      <div class="flex items-center gap-4 p-4 bg-card border border-border rounded-md">
        <Badge
          :variant="isFormValid ? 'default' : 'destructive'"
          :class="{ 'px-3 py-1 text-sm': true, 'bg-green-500': isFormValid }"
        >
          {{ isFormValid ? '✓ Valid form' : '✗ Invalid form' }}
        </Badge>
        <span class="text-sm text-muted"> {{ validationErrors.length }} error(s) </span>
      </div>
    </form>
  </div>
</template>
