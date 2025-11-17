import { ref } from 'vue';
import type { CheckInPlugin } from '../composables';

export interface ValidationOptions<T = unknown> {
  /** List of required fields */
  required?: (keyof T)[];

  /** Custom validation function. Return true for valid, false or error message for invalid */
  validate?: (data: T) => boolean | string;

  /** Maximum number of errors to keep in cache (default: 50) */
  maxErrors?: number;
}

export interface ValidationError {
  /** ID of the item that failed validation */
  id: string | number;
  /** Error message */
  message: string;
  /** Timestamp when the error occurred */
  timestamp: number;
  /** Type of validation error */
  type: 'required-field' | 'custom-validation';
  /** Field name if it's a required field error */
  field?: string;
}

/**
 * Plugin to validate data before check-in.
 * Validates required fields and runs custom validation logic.
 *
 * @example
 * ```ts
 * const { desk } = createDesk('handlers', {
 *   plugins: [
 *     createValidationPlugin({
 *       required: ['name', 'email'],
 *       validate: (data) => {
 *         if (!data.email.includes('@')) {
 *           return 'Invalid email format';
 *         }
 *         return true;
 *       }
 *     })
 *   ]
 * });
 * 
 * // Access validation errors
 * const errors = desk.getValidationErrors();
 * const lastError = desk.getLastValidationError();
 * ```
 */
export const createValidationPlugin = <T = unknown>(
  options: ValidationOptions<T>
): CheckInPlugin<T> => {
  const { maxErrors = 50 } = options;
  const validationErrors = ref<ValidationError[]>([]);

  const addError = (error: ValidationError) => {
    validationErrors.value.push(error);
    // Keep only the last maxErrors entries
    if (validationErrors.value.length > maxErrors) {
      validationErrors.value = validationErrors.value.slice(-maxErrors);
    }
  };

  return {
    name: 'validation',
    version: '1.0.0',

    install: () => {
      return () => {
        // Clear errors on cleanup
        validationErrors.value = [];
      };
    },

    onBeforeCheckIn: (id: string | number, data: T): boolean => {
      // Check required fields
      if (options.required) {
        for (const field of options.required) {
          if (data[field] === undefined || data[field] === null) {
            addError({
              id,
              message: `Field '${String(field)}' is required for item ${id}`,
              timestamp: Date.now(),
              type: 'required-field',
              field: String(field),
            });
            return false;
          }
        }
      }

      // Custom validation
      if (options.validate) {
        const result = options.validate(data);
        if (result === false) {
          addError({
            id,
            message: `Validation failed for item ${id}`,
            timestamp: Date.now(),
            type: 'custom-validation',
          });
          return false;
        }
        if (typeof result === 'string') {
          addError({
            id,
            message: result,
            timestamp: Date.now(),
            type: 'custom-validation',
          });
          return false;
        }
      }

      return true;
    },

    methods: {
      /**
       * Get all validation errors
       */
      getValidationErrors: () => validationErrors.value,

      /**
       * Get the last validation error
       */
      getLastValidationError: () => 
        validationErrors.value.length > 0 
          ? validationErrors.value[validationErrors.value.length - 1] 
          : null,

      /**
       * Get validation errors for a specific item ID
       */
      getValidationErrorsById: (_desk: any, id: string | number) => 
        validationErrors.value.filter(error => error.id === id),

      /**
       * Clear all validation errors
       */
      clearValidationErrors: () => {
        validationErrors.value = [];
      },

      /**
       * Get validation errors by type
       */
      getValidationErrorsByType: (_desk: any, type: ValidationError['type']) =>
        validationErrors.value.filter(error => error.type === type),
    },

    computed: {
      /**
       * Get the number of validation errors
       */
      validationErrorCount: () => validationErrors.value.length,

      /**
       * Check if there are any validation errors
       */
      hasValidationErrors: () => validationErrors.value.length > 0,
    },
  };
};
