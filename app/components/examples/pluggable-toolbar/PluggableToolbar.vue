<script setup lang="ts">
/**
 * Slots Toolbar Example
 *
 * Demonstrates:
 * - Using slots to create a flexible toolbar layout
 * - Dynamically organizing ToolItem components by zones
 */

import { useSlots, type HTMLAttributes, type VNode, Fragment, h } from 'vue';
import { useCheckIn } from '#vue-airport';
import { cn } from '@/lib/utils';
import { SLOTS_TOOLBAR_DESK_KEY, type SlotsToolbarContext, type ToolItemData } from '.';

export interface SlotsToolbarProps {
  class?: HTMLAttributes['class'];
  itemClass?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<SlotsToolbarProps>(), {
  class: undefined,
  itemClass: undefined,
});

const slots = useSlots();

// Extraire les noms de zones des VNodes de zones pour les passer au desk
const zoneNames = computed(() => {
  const slotContent = slots.default?.() || [];
  const names: string[] = [];

  slotContent.forEach((vnode) => {
    if (typeof vnode.type === 'symbol') return;

    const componentType = vnode.type as any;
    const isZone = componentType?.__isToolbarZone === true;

    if (isZone) {
      const name = vnode.props?.name as string | undefined;
      if (name) names.push(name);
    }
  });

  return names;
});

const { createDesk } = useCheckIn<ToolItemData, SlotsToolbarContext>();
createDesk(SLOTS_TOOLBAR_DESK_KEY, {
  devTools: true,
  context: {
    toolItems: ref<Array<ToolItemData>>([]),
    zones: zoneNames.value,
    itemClass: computed(() => props.itemClass),
  },
});

// Fonction récursive pour extraire la zone d'un VNode
const extractZone = (vnode: VNode): string | undefined => {
  console.log('extractZone called for:', vnode.type, 'props:', vnode.props);

  // Si c'est un Fragment, chercher dans ses enfants
  if (vnode.type === Fragment) {
    const children = vnode.children as VNode[] | undefined;
    if (Array.isArray(children) && children.length > 0 && children[0]) {
      return extractZone(children[0]);
    }
  }

  // Chercher la prop zone directement sur le VNode
  if (vnode.props?.zone) {
    console.log('Found zone in props:', vnode.props.zone);
    return vnode.props.zone as string;
  }

  // Si c'est un composant, chercher dans son slot default ou ses children
  const componentType = vnode.type as any;
  const componentName = componentType?.name || componentType?.__name;
  console.log('Component name:', componentName);

  // Si c'est un PluggableToolItem, il a directement la prop zone
  if (componentName === 'PluggableToolItem') {
    console.log('PluggableToolItem zone:', vnode.props?.zone);
    return vnode.props?.zone as string | undefined;
  }

  // Si c'est un wrapper (comme SaveToolItem), chercher dans les children du slot
  if (typeof componentType === 'object' || typeof componentType === 'function') {
    const children = vnode.children as any;
    console.log('Children type:', typeof children, 'has default?', typeof children?.default);

    // Les children peuvent être une fonction (slot), un tableau, ou un objet avec default
    if (typeof children?.default === 'function') {
      const slotContent = children.default();
      console.log('Slot content:', slotContent);
      if (Array.isArray(slotContent) && slotContent.length > 0) {
        return extractZone(slotContent[0]);
      }
    } else if (Array.isArray(children) && children.length > 0) {
      return extractZone(children[0]);
    }
  }

  console.log('No zone found');
  return undefined;
};

// Fonction pour extraire le nom de zone d'un PluggableToolbarZone
const extractZoneName = (vnode: VNode): string | undefined => {
  if (vnode.type === Fragment) {
    const children = vnode.children as VNode[] | undefined;
    if (Array.isArray(children) && children.length > 0 && children[0]) {
      return extractZoneName(children[0]);
    }
  }
  return vnode.props?.name as string | undefined;
};

// Fonction pour vérifier si un VNode est un PluggableToolbarZone
const isToolbarZone = (vnode: VNode): boolean => {
  if (vnode.type === Fragment) {
    const children = vnode.children as VNode[] | undefined;
    if (Array.isArray(children) && children.length > 0 && children[0]) {
      return isToolbarZone(children[0]);
    }
    return false;
  }

  // Vérifier la propriété __isToolbarZone du composant
  const componentType = vnode.type as any;
  const isZone = componentType?.__isToolbarZone === true;

  console.log('Checking VNode:', componentType?.__name, 'isZone:', isZone);

  return isZone;
};

// Séparer les zones (PluggableToolbarZone) et les items (PluggableToolItem)
const slotSeparation = computed(() => {
  const slotContent = slots.default?.() || [];
  const zones: VNode[] = [];
  const items: VNode[] = [];

  console.log('Slot content:', slotContent.length);

  slotContent.forEach((vnode) => {
    // Ignorer les commentaires Vue
    if (typeof vnode.type === 'symbol') {
      return;
    }

    const isZone = isToolbarZone(vnode);
    console.log('VNode:', vnode.type, 'isZone:', isZone);

    if (isZone) {
      zones.push(vnode);
    } else {
      items.push(vnode);
    }
  });

  console.log('Zones found:', zones.length, 'Items found:', items.length);
  return { zoneVNodes: zones, itemVNodes: items };
});

// Accéder aux valeurs via le computed
const zoneVNodes = computed(() => slotSeparation.value.zoneVNodes);
const itemVNodes = computed(() => slotSeparation.value.itemVNodes);

// Organiser les items par zone
const itemsByZone = computed(() => {
  const zones: Record<string, VNode[]> = {};
  const unzoned: VNode[] = [];

  // Initialiser les zones depuis les VNodes de zones
  zoneVNodes.value.forEach((zoneVNode) => {
    const zoneName = extractZoneName(zoneVNode);
    if (zoneName) {
      zones[zoneName] = [];
    }
  });

  // Parcourir les items et les assigner aux zones
  itemVNodes.value.forEach((vnode) => {
    const zone = extractZone(vnode);
    console.log('Extracting zone for item:', vnode.type, 'zone:', zone);

    if (zone) {
      // L'item a une zone spécifiée
      if (zones[zone] !== undefined) {
        // La zone existe, ajouter l'item
        zones[zone]?.push(vnode);
      }
      // Si la zone n'existe pas, ne pas afficher l'item (zone invalide)
    } else {
      // L'item n'a pas de zone, l'ajouter aux unzoned
      unzoned.push(vnode);
    }
  });

  console.log(
    'Items by zone:',
    Object.entries(zones).map(([name, items]) => ({ name, count: items.length }))
  );
  console.log('Unzoned items:', unzoned.length);

  return { zones, unzoned };
});

// Créer les VNodes de zones avec leurs items en utilisant function slots
const renderedZones = computed(() => {
  return zoneVNodes.value.map((zoneVNode) => {
    const zoneName = extractZoneName(zoneVNode);
    const items = itemsByZone.value.zones[zoneName || ''] || [];

    console.log('Zone:', zoneName, 'Items:', items.length);

    // Créer un nouveau VNode de zone avec une function slot pour de meilleures performances
    return h(zoneVNode.type as any, zoneVNode.props || {}, {
      default: () => items,
    });
  });
});
</script>

<template>
  <div
    data-slot="pluggable-toolbar"
    :class="cn('flex h-full w-full items-center gap-2', props.class)"
  >
    <!-- Rendre les zones avec leurs items -->
    <component :is="zoneVNode" v-for="(zoneVNode, index) in renderedZones" :key="index" />

    <!-- Rendu des items sans zone ou avec zone inconnue -->
    <div v-if="itemsByZone.unzoned.length > 0" class="flex items-center gap-1">
      <component
        :is="item"
        v-for="(item, index) in itemsByZone.unzoned"
        :key="`unzoned-${index}`"
      />
    </div>
  </div>
</template>
