import type { InjectionKey, Ref, ComputedRef } from 'vue';
import type { DeskCore } from '#vue-airport';

export interface ToolItemData {
  id: string;
  label: string;
  icon: string;
}

export interface SlotsToolbarContext {
  toolItems: Ref<ToolItemData[]>;
  gates: string[];
  itemClass: ComputedRef<string | undefined>;
}

export const SLOTS_TOOLBAR_DESK_KEY: InjectionKey<DeskCore<ToolItemData> & SlotsToolbarContext> =
  Symbol('slotsToolbarDesk');

// Pluggable Toolbar
export { default as PluggableToolbar } from './PluggableToolbar.vue';
export { default as PluggableToolbarGate } from './PluggableToolbarGate.vue';
export { default as PluggableToolItem } from './PluggableToolItem.vue';

// Example Toolbar
export { default as Toolbar } from './Toolbar.vue';

// Example Tool Items
export { default as LoadToolItem } from './LoadToolItem.vue';
export { default as SaveToolItem } from './SaveToolItem.vue';
