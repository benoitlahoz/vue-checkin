import type { InjectionKey } from 'vue';
import type { DeskCore } from '#vue-checkin/composables/useCheckIn';

interface FieldData {
  label: string;
  value: string;
  type: 'text' | 'email' | 'number';
  required: boolean;
}

export const FORM_DESK_KEY: InjectionKey<DeskCore<FieldData>> = Symbol('formDesk');

export { default as FormExample } from './FormExample.vue';
export { default as FormField } from './FormField.vue';
