import type { InjectionKey } from 'vue';
import type { CheckInDesk } from '#vue-checkin/composables/useCheckIn';

interface PluginItemData {
  name: string;
  description: string;
}

export const PLUGIN_DESK_KEY: InjectionKey<CheckInDesk<PluginItemData>> = Symbol('pluginDesk');

export { default as PluginExample } from './PluginExample.vue';
export { default as PluginListItem } from './PluginListItem.vue';
