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
import { computeFinalTransformedValue } from '.';
import { cn } from './lib/utils';
import DefaultNodeLayout from './DefaultNodeLayout.vue';

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
    class="ot-node-root"
    :class="cn('ot-node-container', { 'ot-node-container-deleted': tree.deleted }, props.class)"
  >
    <!-- Slot with all necessary props -->
    <slot
      :node="tree"
      :node-id="nodeId"
      :is-open="isOpen"
      :is-hovered="isHovered"
      :is-editing="editingKey"
      :display-value="displayValue"
      :should-show-children="shouldShowChildren"
      :input-field-element="inputFieldElement"
      :input-element="inputElement"
      :handlers="{
        setHovered: (value: boolean) => {
          isHovered = value;
        },
        getChildKey,
      }"
      :components="{
        NodeOpen,
        NodeActions,
        NodeKeyEditor,
        TransformSelect,
        NodeTransformsList,
        ObjectNode,
      }"
    >
      <!-- Fallback: Default layout -->
      <DefaultNodeLayout
        :node="tree"
        :node-id="nodeId"
        :is-hovered="isHovered"
        :is-editing="editingKey"
        :display-value="displayValue"
        :input-field-element="inputFieldElement"
        :input-element="inputElement"
        @update:is-hovered="isHovered = $event"
      />
    </slot>

    <!-- Recursive children -->
    <div v-if="shouldShowChildren && isOpen" class="ot-node-indent">
      <ObjectNode
        v-for="(child, index) in tree.children"
        :id="child.id"
        :key="getChildKey(child, index)"
      />
    </div>
  </div>
</template>

<style>
/* Base CSS custom properties for ObjectNode that can be overridden by users */

:root {
  --ot-indent-width: 0.85rem;
  --ot-row-gap: 0.5rem;
  --ot-row-my: 0.25rem;
  --ot-primary: oklch(0.6723 0.1606 244.9955);
  --ot-primary-foreground: oklch(1 0 0);
  --ot-muted: oklch(0.8422 0.0039 247.8581);
  --ot-muted-foreground: oklch(0.5637 0.0078 247.9662);
  --ot-accent: oklch(0.9647 0.0078 247.8581);
  --ot-accent-foreground: oklch(0.6723 0.1606 244.9955);

  /* Input & Select variables (using accent colors) */
  --ot-input-border: var(--ot-accent);
  --ot-input-bg: var(--ot-accent);
  --ot-input-ring: var(--ot-accent-foreground);
  --ot-input-ring-offset: var(--ot-accent);

  /* Layout offsets - pour alignement des transformations */
  --ot-action-width: 1rem; /* largeur du bouton NodeActions */
  --ot-action-margin: 0.375rem; /* margin-right du bouton NodeActions */
  --ot-value-offset: calc(
    var(--ot-indent-width) + var(--ot-row-gap) + var(--ot-action-width) + var(--ot-action-margin) +
      var(--ot-row-gap)
  ); /* offset total pour aligner avec la valeur: chevron + gap + bouton + margin + gap */

  /* Colors for recipe/preview feedback */
  --ot-blue: oklch(0.5502 0.1789 241.0352);
  --ot-blue-bg: oklch(0.9647 0.0078 247.8581);
  --ot-blue-border: oklch(0.8422 0.0039 247.8581);
  --ot-green: oklch(0.6469 0.1529 141.7661);
  --ot-green-bg: oklch(0.9647 0.0078 247.8581);
  --ot-green-border: oklch(0.8422 0.0039 247.8581);
  --ot-red: oklch(0.6276 0.2218 22.0942);
  --ot-red-bg: oklch(0.9647 0.0078 247.8581);
  --ot-red-border: oklch(0.8422 0.0039 247.8581);
}

:root.dark {
  --ot-primary: oklch(0.6692 0.1607 245.011);
  --ot-primary-foreground: oklch(1 0 0);
  --ot-muted: oklch(0.3628 0.0138 256.8435);
  --ot-muted-foreground: oklch(0.65 0.0128 248.5103);
  --ot-accent: oklch(0.2392 0.0166 250.8453);
  --ot-accent-foreground: oklch(0.6692 0.1607 245.011);

  /* Input & Select variables (using accent colors) */
  --ot-input-border: var(--ot-accent);
  --ot-input-bg: var(--ot-accent);
  --ot-input-ring: var(--ot-accent-foreground);
  --ot-input-ring-offset: var(--ot-accent);

  /* Colors for recipe/preview feedback */
  --ot-blue: oklch(0.7009 0.1436 241.0352);
  --ot-blue-bg: oklch(0.2392 0.0166 250.8453);
  --ot-blue-border: oklch(0.3217 0.0144 253.4316);
  --ot-green: oklch(0.7469 0.1529 141.7661);
  --ot-green-bg: oklch(0.2392 0.0166 250.8453);
  --ot-green-border: oklch(0.3217 0.0144 253.4316);
  --ot-red: oklch(0.7276 0.1818 22.0942);
  --ot-red-bg: oklch(0.2392 0.0166 250.8453);
  --ot-red-border: oklch(0.3217 0.0144 253.4316);
}

/* Main container */
.ot-node-container {
  font-size: 0.75rem;
  line-height: 1rem;
  flex: 1;
}

.ot-node-container-deleted {
  opacity: 0.5;
}

/* Scroll wrapper */
.ot-node-scroll-wrapper {
  overflow-x: auto;
}

/* Main grid: 2 columns × dynamic rows */
.ot-node-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0;
}

.ot-node-grid:hover .ot-node-main-row,
.ot-node-grid:hover .ot-node-main-right,
.ot-node-grid:hover .ot-transform-spacer,
.ot-node-grid:hover .ot-transform-content,
.ot-node-grid:hover .ot-transform-params {
  background-color: oklch(from var(--ot-primary) l c h / 0.1);
}

.ot-node-grid:hover .ot-node-main-row,
.ot-node-grid:hover .ot-transform-spacer {
  border-left: 2px solid var(--ot-primary);
}

.ot-node-grid.ot-node-row-with-chevron:hover .ot-node-main-row {
  padding-left: 0.625rem;
}

.ot-node-row {
  grid-column: 1;
  display: flex;
  align-items: center;
  gap: var(--ot-row-gap);
  min-width: fit-content;
  min-height: 1.5rem;
  padding-top: var(--ot-row-my);
  padding-bottom: var(--ot-row-my);
  padding-left: 0.375rem;
  padding-right: 0.375rem;
  border-left-width: 2px;
  border-left-color: transparent;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.ot-node-right-section {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ot-row-gap);
  padding-top: var(--ot-row-my);
  padding-bottom: var(--ot-row-my);
  padding-right: 0.375rem;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.ot-node-spacer {
  grid-column: 1;
}

.ot-node-transforms-list {
  /* NodeTransformsList will create grid items for column 1 & 2 */
  display: contents;
}

/* Indentation wrapper */
.ot-node-indent {
  margin-left: var(--ot-indent-width);
}

/* Row container - now flex inside grid */

/* Left section: chevron + content */
.ot-node-left-section {
  display: flex;
  align-items: center;
  gap: var(--ot-row-gap);
  flex: 1;
}

/* Chevron container (always reserves space) */
.ot-node-chevron {
  width: var(--ot-indent-width);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

/* Content section: key + button + value */
.ot-node-content-section {
  display: flex;
  align-items: center;
  gap: var(--ot-row-gap);
  flex: 1;
}

/* Action button container with extra margin */
.ot-node-action-button {
  margin-right: 0.25rem;
}

/* Row content */
.ot-node-row-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ot-row-gap);
  flex: 1;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Value displays */
.ot-node-value {
  color: var(--ot-muted-foreground);
}

.ot-node-value-array {
  color: var(--ot-muted-foreground);
  font-style: italic;
}

.ot-node-value-hidden {
  visibility: hidden;
  width: 0;
  height: 0;
}

/* Main params - paramètres de la première transformation sur la ligne principale */
.ot-node-main-params {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

/* Transform select positioning */
.ot-node-transform {
  flex-shrink: 0;
}

/* === Reusable UI Components === */

/* Copy button - standard across all components */
.ot-copy-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  opacity: 0;
  transition: opacity 150ms ease;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid var(--ot-muted);
  background-color: var(--ot-accent);
  color: var(--ot-muted-foreground);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ot-copy-button:hover {
  background-color: var(--ot-muted);
}

.ot-copy-button:focus-visible {
  outline: 2px solid var(--ot-input-ring);
  outline-offset: 2px;
}

.ot-copy-button.visible {
  opacity: 1;
}

.ot-copy-icon {
  width: 1rem;
  height: 1rem;
}

.ot-copy-icon-primary {
  color: var(--ot-primary);
}

/* Progress bar - standard feedback component */
.ot-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0.25rem;
  background-color: var(--ot-muted);
  overflow: hidden;
  opacity: 0;
  transition: opacity 150ms ease;
}

.ot-progress-bar.visible {
  opacity: 1;
}

.ot-progress-fill {
  height: 100%;
  transition: width 150ms ease;
}

.ot-progress-fill.idle {
  background-color: var(--ot-muted-foreground);
}

.ot-progress-fill.success {
  background-color: #22c55e; /* green-500 */
}

.ot-progress-fill.error {
  background-color: #ef4444; /* red-500 */
}

/* Button utilities - reusable button variants */
.ot-button-icon {
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid var(--ot-muted);
  background-color: var(--ot-accent);
  color: var(--ot-muted-foreground);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: all 150ms ease;
}

.ot-button-icon:hover {
  background-color: var(--ot-muted);
}

.ot-button-icon:focus-visible {
  outline: 2px solid var(--ot-input-ring);
  outline-offset: 2px;
}

.ot-button-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ot-button-ghost {
  background-color: transparent;
  border-color: transparent;
}

.ot-button-ghost:hover {
  background-color: var(--ot-accent);
}

.ot-button-outline {
  background-color: transparent;
}

.ot-button-outline:hover {
  background-color: var(--ot-accent);
}

.ot-button-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  line-height: 1rem;
}

/* === Node Actions === */
.ot-actions-container {
  overflow: hidden;
  transition-property: width;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.ot-actions-visible {
  width: 1rem;
  margin-right: 0.375rem;
}

.ot-actions-hidden {
  width: 0;
}

.ot-actions-button {
  height: 1rem;
  width: 1rem;
  padding: 0;
  flex-shrink: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.ot-actions-button:hover {
  opacity: 0.8;
}

.ot-actions-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--ot-muted-foreground);
  transition-property: color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.ot-actions-icon-delete:hover {
  color: var(--ot-destructive, #ef4444);
}

.ot-actions-button:has(.ot-actions-icon:not(.ot-actions-icon-delete)):hover .ot-actions-icon {
  color: var(--ot-primary);
}

/* === Key Editor === */
.ot-key-editor {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ot-key-editable {
  cursor: pointer;
}

.ot-key-readonly {
  cursor: default;
}

.ot-key-input {
  height: 1.5rem;
  padding: 0 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  border: 1px solid var(--ot-input-border);
  border-radius: 0.375rem;
  background-color: var(--ot-input-bg);
  color: inherit;
  outline: none;
  transition-property: border-color, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.ot-key-input:focus {
  border-color: var(--ot-input-ring);
  box-shadow: 0 0 0 3px oklch(from var(--ot-input-ring) l c h / 0.1);
}

/* === Node Open Icon === */
.ot-open-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--ot-muted-foreground);
  cursor: pointer;
  flex-shrink: 0;
  transition-property: color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.ot-open-icon:hover {
  color: var(--ot-primary);
}

/* === Node Values === */
.ot-node-value {
  color: var(--ot-muted-foreground);
}

.ot-node-value-array {
  color: var(--ot-muted-foreground);
  font-style: italic;
}

.ot-node-value-hidden {
  visibility: hidden;
  width: 0;
  height: 0;
}

/* === Transforms List === */
.ot-transform-row {
  display: contents;
}

.ot-transform-row:hover .ot-transform-value {
  color: var(--ot-primary-foreground);
}

.ot-transform-spacer {
  grid-column: 1;
  padding-top: var(--ot-row-my);
  padding-bottom: var(--ot-row-my);
  padding-left: 0.375rem;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.ot-transforms-list {
  overflow-x: auto;
}

.ot-transform-item {
  margin-top: var(--ot-row-my);
  margin-bottom: var(--ot-row-my);
}

.ot-transform-content {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ot-row-gap);
  padding-top: var(--ot-row-my);
  padding-bottom: var(--ot-row-my);
  padding-right: 0.375rem;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.ot-transform-params {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: var(--ot-row-my);
  padding-bottom: var(--ot-row-my);
  padding-right: 0.375rem;
  padding-left: 0.5rem;
  background-color: transparent;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.ot-param-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 120px;
}

.ot-param-item:has(.ot-param-checkbox-wrapper) {
  width: auto;
  min-width: fit-content;
}

.ot-param-label {
  font-size: 0.625rem;
  line-height: 0.875rem;
  color: var(--ot-muted-foreground);
  font-weight: 500;
  text-align: right;
}

.ot-transform-value {
  color: var(--ot-muted-foreground);
  font-size: 0.75rem;
  line-height: 1rem;
  transition-property: color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

@media (min-width: 768px) {
  .ot-transform-content {
    min-height: 1.5rem;
  }

  .ot-transform-value {
    flex: 0 0 auto;
  }
}

/* === Transform Parameters === */
.ot-param-checkbox-wrapper {
  width: auto !important;
  max-width: fit-content;
}

.ot-param-input {
  height: 1.5rem;
  width: 100%;
  padding: 0 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  border: 1px solid var(--ot-input-border);
  border-radius: 0.375rem;
  background-color: var(--ot-input-bg);
  color: inherit;
  outline: none;
  transition-property: border-color, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  box-sizing: border-box;
}

.ot-param-input:focus {
  border-color: var(--ot-input-ring);
  box-shadow: 0 0 0 3px oklch(from var(--ot-input-ring) l c h / 0.1);
}

.ot-param-input::placeholder {
  color: var(--ot-muted-foreground);
}

.ot-param-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border: 1px solid var(--ot-input-border);
  border-radius: 0.25rem;
  background-color: var(--ot-input-bg);
  cursor: pointer;
  transition-property: border-color, background-color, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  position: relative;
  flex-shrink: 0;
}

.ot-param-checkbox:checked {
  background-color: var(--ot-primary);
  border-color: var(--ot-primary);
}

.ot-param-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 0.3rem;
  top: 0.05rem;
  width: 0.35rem;
  height: 0.65rem;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.ot-param-checkbox:focus {
  outline: none;
  border-color: var(--ot-input-ring);
  box-shadow: 0 0 0 3px oklch(from var(--ot-input-ring) l c h / 0.1);
}

.ot-param-checkbox:hover {
  border-color: var(--ot-input-ring);
}

/* === Transform Select === */
.ot-select-container {
  display: flex;
  align-items: center;
}

.ot-select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.ot-select {
  height: 1.5rem;
  width: 120px;
  padding: 0.125rem 1.75rem 0.125rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  border-width: 1px;
  border-style: solid;
  border-color: var(--ot-input-border);
  border-radius: 0.375rem;
  background-color: var(--ot-input-bg);
  color: inherit;
  outline: none;
  cursor: pointer;
  transition-property: border-color, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ot-select[value=''] {
  color: var(--ot-muted-foreground);
}

.ot-select option[value=''][disabled] {
  color: var(--ot-muted-foreground);
}

.ot-select option {
  color: initial;
}

.ot-select:hover:not(:disabled) {
  border-color: var(--ot-input-ring);
}

.ot-select:focus {
  border-color: var(--ot-input-ring);
  box-shadow: 0 0 0 3px oklch(from var(--ot-input-ring) l c h / 0.1);
}

.ot-select:not(:focus) {
  box-shadow: none;
}

.ot-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ot-select-icon {
  position: absolute;
  right: 0.375rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  pointer-events: none;
  color: var(--ot-muted-foreground);
}

@media (max-width: 768px) {
  .ot-select {
    width: auto;
    min-width: 80px;
  }
}

/* === Recipe Feedback === */
.ot-recipe-feedback {
  flex-shrink: 0;
  border-radius: 0.5rem;
  border-width: 1px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ot-recipe-idle {
  background: var(--ot-blue-bg);
  border-color: var(--ot-blue-border);
}

.ot-recipe-success {
  background: var(--ot-green-bg);
  border-color: var(--ot-green-border);
}

.ot-recipe-error {
  background: var(--ot-red-bg);
  border-color: var(--ot-red-border);
}

.ot-recipe-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ot-recipe-icon-idle {
  height: 1rem;
  width: 1rem;
  color: var(--ot-blue);
  animation: ot-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.ot-recipe-icon-success {
  height: 1rem;
  width: 1rem;
  color: var(--ot-green);
}

.ot-recipe-icon-error {
  height: 1rem;
  width: 1rem;
  color: var(--ot-red);
}

.ot-recipe-message {
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
}

.ot-recipe-feedback .ot-progress-bar {
  position: relative;
  width: 100%;
  height: 0.5rem;
  border-radius: 9999px;
}

.ot-recipe-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.ot-recipe-wrapper:hover .ot-copy-button {
  opacity: 1;
}

.ot-recipe-content {
  font-size: 0.75rem;
  line-height: 1rem;
  background: var(--ot-accent);
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow: auto;
  max-height: 500px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* === Preview Content === */
.ot-preview-content {
  font-size: 0.75rem;
  line-height: 1rem;
  background: var(--ot-accent);
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow: auto;
  max-height: 500px;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.ot-preview-line {
  height: 18px;
  line-height: 18px;
  white-space: pre;
}

/* === Container Classes === */
.ot-recipe-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ot-preview-container {
  height: 100%;
  position: relative;
}

/* === Animations === */
@keyframes ot-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
