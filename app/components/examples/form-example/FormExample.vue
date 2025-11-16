<script setup lang="ts">
import { useCheckIn, createValidationPlugin } from '@/vue-checkin/composables/useCheckIn';

// Type pour un champ de formulaire
interface FormField {
  label: string;
  value: string;
  type: 'text' | 'email' | 'number';
  required: boolean;
}

// Plugin de validation personnalisé
const validationPlugin = createValidationPlugin<FormField>({
  validate: (data: FormField) => {
    // Vérifier si le champ est requis
    if (data.required && !data.value) {
      return 'Ce champ est requis';
    }
    
    // Vérifier le format email
    if (data.type === 'email' && data.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.value)) {
        return 'Email invalide';
      }
    }
    
    return true;
  },
});

// Créer un desk avec validation
const { createDesk } = useCheckIn<FormField>();
const { desk } = createDesk('formDesk', {
  debug: true,
  plugins: [validationPlugin],
});

// Typage étendu pour les méthodes des plugins
type DeskWithValidation = typeof desk & {
  isValid?: Ref<boolean>;
  getErrors?: () => Record<string | number, string>;
};

const deskWithValidation = desk as DeskWithValidation;

// Computed pour les champs
const fields = computed(() => desk.getAll({ sortBy: 'timestamp', order: 'asc' }));
const isFormValid = computed(() => deskWithValidation.isValid?.value ?? false);
const errors = computed(() => deskWithValidation.getErrors?.() || {});

// Mettre à jour la valeur d'un champ
const updateFieldValue = (id: string | number, value: string) => {
  desk.update(id, { value });
};

// Soumettre le formulaire
const submitForm = () => {
  if (isFormValid.value) {
    const formData = fields.value.reduce((acc, field) => {
      acc[field.id] = field.data.value;
      return acc;
    }, {} as Record<string | number, string>);

    alert('Formulaire soumis avec succès!\n\n' + JSON.stringify(formData, null, 2));
  } else {
    alert('Le formulaire contient des erreurs. Veuillez les corriger.');
  }
};

// Réinitialiser le formulaire
const resetForm = () => {
  fields.value.forEach((field) => {
    desk.update(field.id, { value: '' });
  });
};

// Pré-remplir avec des champs
onMounted(() => {
  desk.checkIn('name', {
    label: 'Nom',
    value: '',
    type: 'text',
    required: true,
  });

  desk.checkIn('email', {
    label: 'Email',
    value: '',
    type: 'email',
    required: true,
  });

  desk.checkIn('age', {
    label: 'Âge',
    value: '',
    type: 'number',
    required: false,
  });
});
</script>

<template>
  <div class="demo-container">
    <h2>Form Example - Validation</h2>
    <p class="description">
      Exemple d'utilisation avec un formulaire et plugin de validation.
    </p>

    <form class="form" @submit.prevent="submitForm">
      <div v-for="field in fields" :key="field.id" class="form-field">
        <label :for="String(field.id)" class="label">
          {{ field.data.label }}
          <span v-if="field.data.required" class="required">*</span>
        </label>
        <UInput
          :id="String(field.id)"
          :model-value="field.data.value"
          :type="field.data.type"
          :placeholder="`Entrez ${field.data.label.toLowerCase()}`"
          @update:model-value="updateFieldValue(field.id, $event)"
        />
        <span v-if="errors[field.id]" class="error">
          {{ errors[field.id] }}
        </span>
      </div>

      <div class="form-actions">
        <UButton
          type="submit"
          icon="i-heroicons-check"
          :disabled="!isFormValid"
        >
          Soumettre
        </UButton>
        <UButton
          type="button"
          variant="soft"
          icon="i-heroicons-arrow-path"
          @click="resetForm"
        >
          Réinitialiser
        </UButton>
      </div>

      <div class="validation-status">
        <UBadge :color="isFormValid ? 'success' : 'error'">
          {{ isFormValid ? '✓ Formulaire valide' : '✗ Formulaire invalide' }}
        </UBadge>
        <span v-if="Object.keys(errors).length > 0" class="error-count">
          {{ Object.keys(errors).length }} erreur(s)
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
