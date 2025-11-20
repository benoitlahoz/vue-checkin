<script setup lang="ts">
/**
 * Slots Toolbar Example
 *
 * Demonstrates:
 * - Using slots to create a flexible toolbar layout
 * - Dynamically organizing ToolItem components by gates
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

// Extract gates names from PluggableToolbarGate components
const gatesNames = computed(() => {
  const slotContent = slots.default?.() || [];
  const names: string[] = [];

  slotContent.forEach((vnode) => {
    if (typeof vnode.type === 'symbol') return;

    const componentType = vnode.type as any;
    const isGate = componentType?.__isToolbarGate === true;

    if (isGate) {
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
    gates: gatesNames.value,
    itemClass: computed(() => props.itemClass),
  },
});

// Recursive function to extract the gate from a VNode
const extractGate = (vnode: VNode): string | undefined => {
  // If it's a Fragment, look into its children
  if (vnode.type === Fragment) {
    const children = vnode.children as VNode[] | undefined;
    if (Array.isArray(children) && children.length > 0 && children[0]) {
      return extractGate(children[0]);
    }
  }

  // Look for the gate prop directly on the VNode (works for all components with a gate prop)
  if (vnode.props?.gate) {
    return vnode.props.gate as string;
  }

  // If it's a component, look into its default slot or its children
  const componentType = vnode.type as any;

  // Si c'est un PluggableToolItem, il a directement la prop gate
  if (componentType?.__isToolbarItem === true) {
    return vnode.props?.gate as string | undefined;
  }

  return undefined;
};

// Function to extract the gate name from a PluggableToolbarGate VNode
const extractGateName = (vnode: VNode): string | undefined => {
  if (vnode.type === Fragment) {
    const children = vnode.children as VNode[] | undefined;
    if (Array.isArray(children) && children.length > 0 && children[0]) {
      return extractGateName(children[0]);
    }
  }
  return vnode.props?.name as string | undefined;
};

// Function to check if a VNode is a PluggableToolbarGate
const isToolbarGate = (vnode: VNode): boolean => {
  if (vnode.type === Fragment) {
    const children = vnode.children as VNode[] | undefined;
    if (Array.isArray(children) && children.length > 0 && children[0]) {
      return isToolbarGate(children[0]);
    }
    return false;
  }

  // Check the __isToolbarGate property of the component
  const componentType = vnode.type as any;
  const isGate = componentType?.__isToolbarGate === true;

  return isGate;
};

// Separate gates (PluggableToolbarGate) and items (PluggableToolItem)
const slotSeparation = computed(() => {
  const slotContent = slots.default?.() || [];
  const gates: VNode[] = [];
  const items: VNode[] = [];

  slotContent.forEach((vnode) => {
    // Ignore symbol types (e.g., text nodes)
    if (typeof vnode.type === 'symbol') {
      return;
    }

    const isGate = isToolbarGate(vnode);

    if (isGate) {
      gates.push(vnode);
    } else {
      items.push(vnode);
    }
  });

  return { gateVNodes: gates, itemVNodes: items };
});

// Access values via computed
const gateVNodes = computed(() => slotSeparation.value.gateVNodes);
const itemVNodes = computed(() => slotSeparation.value.itemVNodes);

// Organize items by gate
const itemsByGate = computed(() => {
  const gates: Record<string, VNode[]> = {};
  const noGate: VNode[] = [];

  // Initialize gates from gate VNodes
  gateVNodes.value.forEach((gateVNode) => {
    const gateName = extractGateName(gateVNode);
    if (gateName) {
      gates[gateName] = [];
    }
  });

  // Iterate over items and assign them to gates
  itemVNodes.value.forEach((vnode) => {
    const gate = extractGate(vnode);

    if (gate) {
      // The item has a specified gate
      if (gates[gate] !== undefined) {
        // The gate exists, add the item
        gates[gate]?.push(vnode);
      }
      // If the gate does not exist, do not display the item (invalid gate)
    } else {
      // The item has no gate, add it to noGates
      noGate.push(vnode);
    }
  });

  return { gates, noGate };
});

// Create VNodes of gates with their items using function slots
const renderedGates = computed(() => {
  return gateVNodes.value.map((gateVNode) => {
    const gateName = extractGateName(gateVNode);
    const items = itemsByGate.value.gates[gateName || ''] || [];

    // Create a new gate VNode with a function slot for better performance
    return h(gateVNode.type as any, gateVNode.props || {}, {
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
    <!-- Render gates with their items -->
    <component :is="gateVNode" v-for="(gateVNode, index) in renderedGates" :key="index" />

    <!-- Render items without a gate or with an unknown gate -->
    <div v-if="itemsByGate.noGate.length > 0" class="flex items-center gap-1">
      <component :is="item" v-for="(item, index) in itemsByGate.noGate" :key="`nogate-${index}`" />
    </div>
  </div>
</template>
