import type { InjectionKey } from 'vue';
import type { CheckInDesk } from '#vue-checkin/composables/useCheckIn';

interface DemoData {
  value: number;
  timestamp: number;
}

export const AUTO_DESK_KEY: InjectionKey<CheckInDesk<DemoData>> = Symbol('autoDesk');

export { default as AutoCheckInExample } from './AutoCheckInExample.vue';
export { default as DemoChild } from './DemoChild.vue';
