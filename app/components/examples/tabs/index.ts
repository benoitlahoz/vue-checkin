import type { InjectionKey, ComputedRef, Ref } from 'vue';
import type { DeskCore } from '#vue-airport/composables/useCheckIn';

export interface TabItemData {
  label: string;
  content: string;
  icon?: string;
}

export interface TabItemContext {
  activeTab: Ref<string | number>;
  selectTab: (id: string | number) => void;
  closeTab: (id: string | number) => void;
  tabsCount: ComputedRef<number>;
  tabsData: Ref<Array<TabItemData & { id: string | number }>>;
}

export const TABS_DESK_KEY: InjectionKey<DeskCore<TabItemData> & TabItemContext> =
  Symbol('tabsDesk');

export { default as Tabs } from './Tabs.vue';
export { default as TabItem } from './TabItem.vue';
