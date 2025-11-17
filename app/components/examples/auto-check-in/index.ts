import type { InjectionKey } from 'vue';
import type { DeskCore } from '#vue-checkin/composables/useCheckIn';

interface DemoData {
  value: number;
  timestamp: number;
}

export const AUTO_DESK_KEY: InjectionKey<DeskCore<DemoData>> = Symbol('autoDesk');

export { default as AutoCheckInExample } from './AutoCheckInExample.vue';
export { default as DemoChild } from './DemoChild.vue';
