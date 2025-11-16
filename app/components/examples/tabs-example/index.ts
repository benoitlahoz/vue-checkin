import type { InjectionKey } from 'vue';
import type { CheckInDesk } from '#vue-checkin/composables/useCheckIn';

interface TabData {
  label: string;
  icon: string;
}

export const TABS_DESK_KEY: InjectionKey<CheckInDesk<TabData>> = Symbol('tabsDesk');

export { default as TabsExample } from './TabsExample.vue';
export { default as TabItem } from './TabItem.vue';
