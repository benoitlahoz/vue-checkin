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
import { formatValue, computeFinalTransformedValue } from '.';
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

// Utilities from desk
const getChildKey = (child: ObjectNodeData, index: number) =>
  deskWithContext.generateChildKey(child, index);

// Check if children should be displayed
// Hide children if transforms change the type to a primitive
const shouldShowChildren = computed(() => {
  if (!tree.value.children?.length) return false;
  if (!tree.value.transforms?.length) return true;

  // If node has transforms, check if final type is still object/array
  const finalValue = computeFinalTransformedValue(tree.value);
  const finalType = typeof finalValue;

  // Show children only if final value is still an object or array
  return finalType === 'object' && (Array.isArray(finalValue) || finalValue !== null);
});

// Compute the display value (ORIGINAL value, not transformed)
// For primitives, always show the original value stored in node.value
// Transformed values are shown in the transform chain below
const displayValue = computed(() => {
  if (!tree.value) return '';
  return tree.value.value;
});
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
      <!-- Grille 2 colonnes: gauche (chevron+actions+key) | droite (value+transforms) -->
      <div
        class="object-node-grid"
        :class="{
          'object-node-row-with-chevron': tree.children?.length && tree.parent,
        }"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <!-- Colonne 1, Ligne 1: Chevron + Actions + Key -->
        <div class="object-node-row object-node-main-row">
          <div class="object-node-left-section">
            <!-- Chevron space (always reserved) -->
            <div class="object-node-chevron">
              <NodeOpen :node-id="nodeId" />
            </div>

            <!-- Key + Delete/Restore container -->
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
            </div>
          </div>
        </div>

        <!-- Colonne 2, Ligne 1: Value + Transform select -->
        <div class="object-node-right-section object-node-main-right">
          <!-- Value (read-only) -->
          <span v-if="tree.type === 'array'" class="object-node-value-array">
            Array({{ tree.children?.length || 0 }})
          </span>
          <span v-else-if="tree.type !== 'object'" class="object-node-value">
            {{ formatValue(displayValue, tree.type) }}
          </span>
          <span v-else class="object-node-value-hidden" />

          <!-- Transformation select -->
          <TransformSelect v-if="tree.parent" :node-id="nodeId" class="object-node-transform" />
        </div>

        <!-- Lignes suivantes: Transformations (générées par NodeTransformsList) -->
        <NodeTransformsList v-if="tree.transforms.length" :node-id="nodeId" />
      </div>
    </div>

    <!-- Recursive children -->
    <div v-if="shouldShowChildren && isOpen" class="object-node-indent">
      <ObjectNode
        v-for="(child, index) in tree.children"
        :id="child.id"
        :key="getChildKey(child, index)"
      />
    </div>

    <Separator v-if="shouldShowChildren && tree.transforms.length" class="object-node-separator" />
  </div>
</template>

<style>
/* Base CSS custom properties for ObjectNode that can be overridden by users */

:root {
  --object-node-indent-width: 0.85rem;
  --object-node-row-gap: 0.5rem;
  --object-node-row-my: 0.25rem;
  --object-node-primary: oklch(0.6723 0.1606 244.9955);
  --object-node-primary-foreground: oklch(1 0 0);
  --object-node-muted: oklch(0.8422 0.0039 247.8581);
  --object-node-muted-foreground: oklch(0.5637 0.0078 247.9662);
  --object-node-accent: oklch(0.9647 0.0078 247.8581);
  --object-node-accent-foreground: oklch(0.6723 0.1606 244.9955);

  /* Input & Select variables (using accent colors) */
  --object-node-input-border: var(--object-node-accent);
  --object-node-input-bg: var(--object-node-accent);
  --object-node-input-ring: var(--object-node-accent-foreground);
  --object-node-input-ring-offset: var(--object-node-accent);

  /* Layout offsets - pour alignement des transformations */
  --object-node-action-width: 1rem; /* largeur du bouton NodeActions */
  --object-node-action-margin: 0.375rem; /* margin-right du bouton NodeActions */
  --object-node-value-offset: calc(
    var(--object-node-indent-width) + var(--object-node-row-gap) + var(--object-node-action-width) +
      var(--object-node-action-margin) + var(--object-node-row-gap)
  ); /* offset total pour aligner avec la valeur: chevron + gap + bouton + margin + gap */
}

:root.dark {
  --object-node-primary: oklch(0.6692 0.1607 245.011);
  --object-node-primary-foreground: oklch(1 0 0);
  --object-node-muted: oklch(0.3628 0.0138 256.8435);
  --object-node-muted-foreground: oklch(0.65 0.0128 248.5103);
  --object-node-accent: oklch(0.2392 0.0166 250.8453);
  --object-node-accent-foreground: oklch(0.6692 0.1607 245.011);

  /* Input & Select variables (using accent colors) */
  --object-node-input-border: var(--object-node-accent);
  --object-node-input-bg: var(--object-node-accent);
  --object-node-input-ring: var(--object-node-accent-foreground);
  --object-node-input-ring-offset: var(--object-node-accent);
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

/* Main grid: 2 columns × dynamic rows */
.object-node-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0;
}

.object-node-grid:hover .object-node-main-row,
.object-node-grid:hover .object-node-main-right,
.object-node-grid:hover .transform-spacer,
.object-node-grid:hover .transform-item-content,
.object-node-grid:hover .transform-params-content {
  background-color: oklch(from var(--object-node-primary) l c h / 0.1);
}

.object-node-grid:hover .object-node-main-row,
.object-node-grid:hover .transform-spacer {
  border-left: 2px solid var(--object-node-primary);
}

.object-node-grid.object-node-row-with-chevron:hover .object-node-main-row {
  padding-left: 0.625rem;
}

.object-node-row {
  grid-column: 1;
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

.object-node-right-section {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--object-node-row-gap);
  padding-top: var(--object-node-row-my);
  padding-bottom: var(--object-node-row-my);
  padding-right: 0.375rem;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.object-node-spacer {
  grid-column: 1;
}

.object-node-transforms-list {
  /* NodeTransformsList will create grid items for column 1 & 2 */
  display: contents;
}

/* Indentation wrapper */
.object-node-indent {
  margin-left: var(--object-node-indent-width);
}

/* Row container - now flex inside grid */

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
  visibility: hidden;
  width: 0;
  height: 0;
}

/* Main params - paramètres de la première transformation sur la ligne principale */
.object-node-main-params {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

/* Transform select positioning */
.object-node-transform {
  flex-shrink: 0;
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
