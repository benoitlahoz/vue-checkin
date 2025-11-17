<script setup lang="ts">
import { useCheckIn, createValidationPlugin } from '#vue-checkin/composables/useCheckIn';
import FormField from './FormField.vue';
import { FORM_DESK_KEY } from './index';

/**
 * Form Example - Validation Plugin
 * 
 * Demonstrates:
 * - Custom validation plugin
 * - Form field validation
 * - Real-time validation feedback
 * - Form submission with validation
 */

// Type definition for form fields
interface FieldData {
  label: string;
  value: string;
  type: 'text' | 'email' | 'number';
  required: boolean;
}

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
    
    return true;
  },
});

// Create a desk with validation plugin
const { createDesk } = useCheckIn<FieldData>();
const { desk } = createDesk(FORM_DESK_KEY, {
  debug: true,
  plugins: [validationPlugin],
});

// Extended type definition to include validation plugin methods
type DeskWithValidation = typeof desk & {
  isValid?: Ref<boolean>;
  getErrors?: () => Record<string | number, string>;
};

const deskWithValidation = desk as DeskWithValidation;

// Form fields state
const fieldsData = ref<Array<{
  id: string;
  label: string;
  value: string;
  type: 'text' | 'email' | 'number';
  required: boolean;
}>>([
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

// Computed properties for validation
const isFormValid = computed(() => deskWithValidation.isValid?.value ?? false);
const errors = computed(() => deskWithValidation.getErrors?.() || {});

// Function to update field value
const updateFieldValue = (id: string, value: string) => {
  const field = fieldsData.value.find(f => f.id === id);
  if (field) {
    field.value = value;
  }
};

// Function to submit the form
const submitForm = () => {
  if (isFormValid.value) {
    const formData = fieldsData.value.reduce((acc, field) => {
      acc[field.id] = field.value;
      return acc;
    }, {} as Record<string, string>);

    alert('Form submitted successfully!\n\n' + JSON.stringify(formData, null, 2));
  } else {
    alert('The form contains errors. Please correct them.');
  }
};

// Function to reset the form
const resetForm = () => {
  fieldsData.value.forEach((field) => {
    field.value = '';
  });
};
</script>

<template>
  <div class="demo-container">
    <h2>Form Example - Validation</h2>
    <p class="description">
      Example usage with a form and validation plugin.
    </p>

    <form class="form" @submit.prevent="submitForm">
      <FormField
        v-for="field in fieldsData"
        :id="field.id"
        :key="field.id"
        :label="field.label"
        :value="field.value"
        :type="field.type"
        :required="field.required"
        :error="errors[field.id]"
        @update="updateFieldValue"
      />

      <div class="form-actions">
        <UButton
          type="submit"
          icon="i-heroicons-check"
          :disabled="!isFormValid"
        >
          Submit
        </UButton>
        <UButton
          type="button"
          variant="soft"
          icon="i-heroicons-arrow-path"
          @click="resetForm"
        >
          Reset
        </UButton>
      </div>

      <div class="validation-status">
        <UBadge :color="isFormValid ? 'success' : 'error'">
          {{ isFormValid ? '✓ Valid form' : '✗ Invalid form' }}
        </UBadge>
        <span v-if="Object.keys(errors).length > 0" class="error-count">
          {{ Object.keys(errors).length }} error(s)
        </span>
      </div>
    </form>
  </div>
</template>

<style scoped>
.demo-container {
  padding: 1.5rem;
  border: 1px solid var(--ui-border-primary);
  border-radius: 0.5rem;
  background: var(--ui-bg-elevated);
}

.description {
  color: var(--ui-text-secondary);
  margin-bottom: 1.5rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

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

.form-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ui-border-primary);
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--ui-bg-secondary);
  border-radius: 0.375rem;
}

.error-count {
  font-size: 0.875rem;
  color: var(--ui-text-secondary);
}
</style>
