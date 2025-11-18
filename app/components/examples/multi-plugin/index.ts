import type { InjectionKey } from 'vue';
import type { DeskCore } from '#vue-airport/composables/useCheckIn';

export interface PluginItemData {
  name: string;
  description: string;
}

export const PLUGIN_DESK_KEY: InjectionKey<DeskCore<PluginItemData>> = Symbol('pluginDesk');

export { default as MultiPlugin } from './MultiPlugin.vue';
export { default as PluginListItem } from './PluginListItem.vue';
