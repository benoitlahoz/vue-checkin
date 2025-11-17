import type { InjectionKey } from 'vue';
import type { DeskCore } from '#vue-checkin/composables/useCheckIn';

interface PluginItemData {
  name: string;
  description: string;
}

export const PLUGIN_DESK_KEY: InjectionKey<DeskCore<PluginItemData>> = Symbol('pluginDesk');

export { default as PluginExample } from './PluginExample.vue';
export { default as PluginListItem } from './PluginListItem.vue';
