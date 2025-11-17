import type { InjectionKey } from 'vue';
import type { DeskCore } from '#vue-checkin/composables/useCheckIn';

export interface DemoData {
  name: string;
  status: 'active' | 'inactive' | 'pending';
  count: number;
}

export const AUTO_DESK_KEY: InjectionKey<DeskCore<DemoData>> = Symbol('autoDesk');

export { default as AutoCheckIn } from './AutoCheckIn.vue';
export { default as AutoCheckItem } from './AutoCheckItem.vue';
