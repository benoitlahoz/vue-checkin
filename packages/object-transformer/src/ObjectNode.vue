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
import { Separator } from './components/ui/separator';
import { isPrimitive as isPrimitiveType, formatValue } from '.';
import { cn } from './lib/utils';

type DeskWithContext = typeof desk & ObjectTransformerContext;

interface Props {
  id?: string | null; // null = root
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  id: null,
  class: '',
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

onClickOutside(inputElement, () => {
  if (editingKey.value) {
    deskWithContext.confirmEditKey(tree.value);
    isHovered.value = false;
  }
});

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
    class="object-node-root"
    :class="
      cn('object-node-container', { 'object-node-container-deleted': tree.deleted }, props.class)
    "
  >
    <!-- Wrapper with horizontal scroll -->
    <div class="object-node-scroll-wrapper">
      <div
        :class="
          cn('object-node-row', {
            'object-node-row-with-chevron': tree.children?.length && tree.parent,
          })
        "
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <!-- Content (with hover) -->
        <div
          :class="
            cn('object-node-row-content', {
              'object-node-row-content-hoverable': tree.parent,
            })
          "
        >
          <!-- Left part: chevron + key + button + value -->
          <div class="object-node-left-section">
            <!-- Chevron space (always reserved) -->
            <div class="object-node-chevron">
              <NodeOpen :node-id="nodeId" />
            </div>

            <!-- Key + Delete/Restore + Value container -->
            <div class="object-node-content-section">
              <!-- Delete/Restore (shown on row hover) -->
              <div
                v-if="tree.parent?.type === 'object' || tree.parent?.type === 'array'"
                class="object-node-action-button"
              >
                <NodeActions :node-id="nodeId" :is-visible="isHovered || editingKey" />
              </div>

              <!-- NodeKey Component -->
              <div ref="inputElement">
                <NodeKeyEditor v-model:input-ref="inputFieldElement" :node-id="nodeId" />
              </div>

              <!-- Value (read-only) -->
              <span v-if="tree.type === 'array'" ref="valueElement" class="object-node-value-array">
                Array({{ tree.children?.length || 0 }})
              </span>
              <span v-else-if="tree.type !== 'object'" ref="valueElement" class="object-node-value">
                {{ formatValue(tree.value, tree.type) }}
              </span>
              <span v-else ref="valueElement" class="object-node-value-hidden" />
            </div>
          </div>

          <!-- Right part: transformation select -->
          <TransformSelect v-if="tree.parent" :node-id="nodeId" class="object-node-transform" />
        </div>
      </div>
    </div>

    <!-- Recursive children -->
    <div v-if="tree.children?.length && isOpen" class="object-node-indent">
      <ObjectNode
        v-for="(child, index) in tree.children"
        :id="child.id"
        :key="getChildKey(child, index)"
      />
    </div>

    <Separator
      v-if="tree.children?.length && tree.transforms.length"
      class="object-node-separator"
    />

    <!-- Transformations + parameters -->
    <NodeTransformsList
      v-if="tree.transforms.length"
      :node-id="nodeId"
      :padding-left="transformsPaddingLeft"
    />
  </div>
</template>

<style>
/* Base CSS custom properties for ObjectNode that can be overridden by users */

:root {
  --object-node-indent-width: 0.85rem;
  --object-node-row-gap: 0.5rem;
  --object-node-row-my: 0.5rem;
  --object-node-primary: oklch(0.6723 0.1606 244.9955);
  --object-node-primary-foreground: oklch(1 0 0);
  --object-node-muted: oklch(0.8422 0.0039 247.8581);
  --object-node-muted-foreground: oklch(0.5637 0.0078 247.9662);
  --object-node-accent: oklch(0.9392 0.0166 250.8453);
  --object-node-accent-foreground: oklch(0.6723 0.1606 244.9955);
}

:root.dark {
  --object-node-primary: oklch(0.6692 0.1607 245.011);
  --object-node-primary-foreground: oklch(1 0 0);
  --object-node-muted: oklch(0.3628 0.0138 256.8435);
  --object-node-muted-foreground: oklch(0.65 0.0128 248.5103);
  --object-node-accent: oklch(0.1928 0.0331 242.5459);
  --object-node-accent-foreground: oklch(0.6692 0.1607 245.011);
}

/* Main container */
.object-node-container {
  font-size: 0.75rem;
  line-height: 1rem;
  flex: 1;
}

.object-node-container-deleted {
  opacity: 0.5;
}

/* Scroll wrapper */
.object-node-scroll-wrapper {
  overflow-x: auto;
}

/* Indentation wrapper */
.object-node-indent {
  margin-left: var(--object-node-indent-width);
}

/* Row container */
.object-node-row {
  display: flex;
  align-items: center;
  gap: var(--object-node-row-gap);
  min-width: fit-content;
  min-height: 1.5rem;
  padding-top: var(--object-node-row-my);
  padding-bottom: var(--object-node-row-my);
  padding-left: 0.375rem;
  padding-right: 0.375rem;
  border-left-width: 2px;
  border-left-color: transparent;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.object-node-row:hover {
  background-color: oklch(from var(--object-node-primary) l c h / 0.1);
  border-left-color: var(--object-node-primary);
}

.object-node-row-with-chevron:hover {
  padding-left: 0.625rem;
}

/* Left section: chevron + content */
.object-node-left-section {
  display: flex;
  align-items: center;
  gap: var(--object-node-row-gap);
  flex: 1;
}

/* Chevron container (always reserves space) */
.object-node-chevron {
  width: var(--object-node-indent-width);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

/* Content section: key + button + value */
.object-node-content-section {
  display: flex;
  align-items: center;
  gap: var(--object-node-row-gap);
  flex: 1;
}

/* Action button container with extra margin */
.object-node-action-button {
  margin-right: 0.25rem;
}

/* Row content */
.object-node-row-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--object-node-row-gap);
  flex: 1;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Value displays */
.object-node-value {
  color: var(--object-node-muted-foreground);
}

.object-node-value-array {
  color: var(--object-node-muted-foreground);
  font-style: italic;
}

.object-node-value-hidden {
  display: none;
}

/* Transform select positioning */
.object-node-transform {
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .object-node-transform {
    margin-left: auto;
  }
}

/* Separator */
.object-node-separator {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

@media (min-width: 768md) {
  .object-node-separator {
    display: none;
  }
}
</style>
