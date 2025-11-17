import type { InjectionKey } from 'vue';
import type { DeskCore } from '#vue-checkin/composables/useCheckIn';

export interface TabItemData {
  label: string;
  content: string;
  icon?: string;
}

export const TABS_DESK_KEY: InjectionKey<DeskCore<TabItemData>> = Symbol('tabsDesk');

export { default as TabsExample } from './TabsExample.vue';
export { default as TabItem } from './TabItem.vue';
