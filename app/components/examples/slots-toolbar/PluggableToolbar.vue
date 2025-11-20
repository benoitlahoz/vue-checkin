<script setup lang="ts">
/**
 * Slots Toolbar Example
 *
 * Demonstrates:
 * - Using slots to create a flexible toolbar layout
 * - Dynamically organizing ToolItem components by zones
 */

import { useSlots, type HTMLAttributes, type VNode, Fragment } from 'vue';
import { useCheckIn } from '#vue-airport';
import { cn } from '@/lib/utils';
import { SLOTS_TOOLBAR_DESK_KEY, type SlotsToolbarContext, type ToolItemData } from '.';

export interface SlotsToolbarProps {
  zones?: string[];
  class?: HTMLAttributes['class'];
  itemClass?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<SlotsToolbarProps>(), {
  zones: () => [] as string[],
  class: undefined,
  itemClass: undefined,
});

const slots = useSlots();

const { createDesk } = useCheckIn<ToolItemData, SlotsToolbarContext>();
createDesk(SLOTS_TOOLBAR_DESK_KEY, {
  devTools: true,
  context: {
    toolItems: ref<Array<ToolItemData>>([]),
    zones: props.zones,
  },
});

// Fonction récursive pour extraire la zone d'un VNode
const extractZone = (vnode: VNode): string | undefined => {
  // Si c'est un Fragment, chercher dans ses enfants
  if (vnode.type === Fragment) {
    const children = vnode.children as VNode[] | undefined;
    if (Array.isArray(children) && children.length > 0 && children[0]) {
      return extractZone(children[0]);
    }
  }

  // Chercher la prop zone
  return vnode.props?.zone as string | undefined;
};

// Organiser les items par zone
const itemsByZone = computed(() => {
  const slotContent = slots.default?.() || [];
  const zones: Record<string, VNode[]> = {};
  const unzoned: VNode[] = [];

  // Initialiser les zones définies
  props.zones.forEach((zone) => {
    zones[zone] = [];
  });

  // Parcourir directement les VNodes du slot
  slotContent.forEach((vnode) => {
    const zone = extractZone(vnode);

    if (zone && props.zones.includes(zone)) {
      zones[zone]?.push(vnode);
    } else {
      unzoned.push(vnode);
    }
  });

  return { zones, unzoned };
});
</script>

<template>
  <div :class="cn('flex h-fit w-full items-center gap-2', props.class)">
    <!-- Rendu des zones définies -->
    <template v-for="zone in props.zones" :key="zone">
      <div
        v-if="itemsByZone.zones[zone] && itemsByZone.zones[zone].length > 0"
        :class="cn('toolbar-zone flex items-center gap-1', `zone-${zone}`)"
      >
        <div
          v-for="(item, index) in itemsByZone.zones[zone]"
          :key="`${zone}-${index}`"
          :class="cn('toolbar-item', props.itemClass)"
        >
          <component :is="item" />
        </div>
      </div>
    </template>

    <!-- Rendu des items sans zone ou avec zone inconnue -->
    <div v-if="itemsByZone.unzoned.length > 0" class="toolbar-unzoned flex items-center gap-1">
      <div
        v-for="(item, index) in itemsByZone.unzoned"
        :key="`unzoned-${index}`"
        :class="cn('toolbar-item', props.itemClass)"
      >
        <component :is="item" />
      </div>
    </div>
  </div>
</template>
