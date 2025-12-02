<script setup lang="ts">
import { computed, ref } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useCheckIn } from 'vue-airport';
import {
  ObjectNode,
  NodeKeyEditor,
  NodeActions,
  NodeOpen,
  TransformSelect,
  NodeTransformsList,
  type ObjectNodeData,
  type ObjectTransformerContext,
  ObjectTransformerDeskKey,
} from '.';
import { Separator } from '@/components/ui/separator';
import { isPrimitive as isPrimitiveType, formatValue } from '.';

type DeskWithContext = typeof desk & ObjectTransformerContext;

interface Props {
  id?: string | null; // null = root
}

const props = withDefaults(defineProps<Props>(), {
  id: null,
});

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);
const deskWithContext = desk as DeskWithContext;

// Get the node from the desk
const tree = computed(() => {
  if (props.id === null) {
    return deskWithContext.tree.value;
  }
  const node = deskWithContext.getNode(props.id);
  if (!node) {
    console.warn('Node not found:', props.id);
    return deskWithContext.tree.value;
  }
  return node;
});

// Computed node ID for sub-components
const nodeId = computed(() => tree.value.id);

// State
const isOpen = computed(() => tree.value.isOpen ?? true);
const isPrimitive = computed(() => isPrimitiveType(tree.value.type));
const editingKey = computed(() => deskWithContext.editingNode.value === tree.value);
const isHovered = ref(false);
const inputFieldElement = ref<any>(null);

// Click outside handling
const inputElement = ref<HTMLElement | null>(null);
const buttonElement = ref<HTMLElement | null>(null);

onClickOutside(
  inputElement,
  () => {
    if (editingKey.value) {
      deskWithContext.confirmEditKey(tree.value);
      isHovered.value = false;
    }
  }
  /*
  {
    ignore: [buttonElement],
  }
    */
);

// Layout helpers
const valueElement = ref<HTMLElement | null>(null);
const firstChildElement = ref<HTMLElement | null>(null);
const transformsPaddingLeft = computed(() => {
  // Pour les primitives, utiliser valueElement
  if (isPrimitive.value && valueElement.value) {
    const rect = valueElement.value.getBoundingClientRect();
    const containerEl = valueElement.value.closest('.text-xs');
    if (!containerEl) return '0px';
    const containerRect = containerEl.getBoundingClientRect();
    const offset = rect.left - containerRect.left;
    return `${offset}px`;
  }

  // For non-primitives, use firstChildElement
  if (!isPrimitive.value && firstChildElement.value) {
    const rect = firstChildElement.value.getBoundingClientRect();
    const containerEl = firstChildElement.value.closest('.object-node-root');
    if (!containerEl) return '0px';
    const containerRect = containerEl.getBoundingClientRect();
    const offset = rect.left - containerRect.left;
    return `${offset}px`;
  }

  return '0px';
});

// Utilities from desk
const getChildKey = (child: ObjectNodeData, index: number) =>
  deskWithContext.generateChildKey(child, index);
</script>

<template>
  <div
    data-slot="object-node"
    class="text-xs object-node-root flex-1"
    :class="{ 'opacity-50': tree.deleted }"
  >
    <!-- Wrapper with horizontal scroll -->
    <div class="overflow-x-auto">
      <div
        class="flex items-center justify-between gap-2 my-1 ml-2 transition-all group hover:bg-accent/30 min-w-fit"
      >
        <!-- Left part: chevron + delete + key + value -->
        <div class="flex items-center gap-2">
          <NodeOpen :node-id="nodeId" />

          <!-- Container for button + name with common hover -->
          <div
            ref="firstChildElement"
            class="flex items-center transition-all group-hover:border-l-2 group-hover:border-primary group-hover:pl-2.5 -ml-0.5 pl-1.5"
            @mouseenter="isHovered = true"
            @mouseleave="!editingKey && (isHovered = false)"
          >
            <!-- Delete/Restore -->
            <div
              v-if="tree.parent?.type === 'object' || tree.parent?.type === 'array'"
              ref="buttonElement"
            >
              <NodeActions :node-id="nodeId" :is-visible="isHovered || editingKey" />
            </div>

            <!-- NodeKey Component -->
            <div ref="inputElement">
              <NodeKeyEditor v-model:input-ref="inputFieldElement" :node-id="nodeId" />
            </div>

            <!-- Value (read-only) - hidden for object/array -->
            <span
              v-if="tree.type !== 'object' && tree.type !== 'array'"
              ref="valueElement"
              class="ml-2 text-muted-foreground"
            >
              {{ formatValue(tree.value, tree.type) }}
            </span>
            <span v-else ref="valueElement" class="hidden" />
          </div>
        </div>

        <!-- Right part: transformation select -->
        <div class="shrink-0 md:ml-auto">
          <TransformSelect :node-id="nodeId" />
        </div>
      </div>
    </div>

    <!-- Recursive children -->
    <div v-if="tree.children?.length && isOpen" class="ml-3.5 border-l border-border pl-0">
      <ObjectNode
        v-for="(child, index) in tree.children"
        :id="child.id"
        :key="getChildKey(child, index)"
      />
    </div>

    <Separator v-if="tree.children?.length && tree.transforms.length" class="my-2 md:hidden" />

    <!-- Transformations + parameters -->
    <NodeTransformsList
      v-if="tree.transforms.length"
      :node-id="nodeId"
      :padding-left="transformsPaddingLeft"
    />
  </div>
</template>
