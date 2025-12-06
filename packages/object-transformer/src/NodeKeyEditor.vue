<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { useCheckIn } from 'vue-airport';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey, shouldStartEdit, canConfirmEdit } from '.';
import { cn } from './lib/utils';

interface Props {
  nodeId: string;
  class?: HTMLAttributes['class'];
  style?: HTMLAttributes['style'];
}

const props = defineProps<Props>();

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

if (!desk) {
  throw new Error('ObjectTransformer desk not found');
}

// Get node from desk
const node = computed(() => desk.getNode(props.nodeId));
const isEditing = computed(() => desk.editingNode.value === node.value);
const tempKey = computed(() => desk.tempKey.value);
const keyClasses = computed(() => (node.value ? desk.getKeyClasses(node.value) : ''));

// Check if this is an array element (parent is array type)
const isArrayElement = computed(() => node.value?.parent?.type === 'array');

// Format display key: [index] for array elements, regular key for object properties
const displayKey = computed(() => {
  if (!node.value?.key) return '';
  if (isArrayElement.value) {
    return `[${node.value.key}]`;
  }
  return node.value.key;
});

const inputRef = defineModel<HTMLInputElement | null>('inputRef');

// Calculate input width based on content
const inputWidth = computed(() => {
  if (!isEditing.value) return 'auto';
  const text = tempKey.value || '';
  // Rough estimate: 1 character ≈ 0.6em for monospace-ish font at 0.75rem
  const charWidth = 0.6;
  const padding = 1; // 0.5rem on each side
  const minChars = 3;
  const chars = Math.max(minChars, text.length + 1);
  return `${chars * charWidth + padding}rem`;
});

const startEdit = () => {
  if (!node.value) return;
  if (shouldStartEdit(node.value, desk.editingNode.value)) {
    desk.startEditKey(node.value);
  }
};

const canEdit = computed(() => {
  if (!node.value) return false;
  // Soft deleted nodes cannot be edited (only restored via button)
  if (node.value.deleted) return false;
  // Array elements cannot be edited (their indices are fixed)
  if (isArrayElement.value) return false;
  return shouldStartEdit(node.value, null);
});

const updateTempKey = (value: string) => {
  desk.tempKey.value = value;
};

const confirmEdit = () => {
  if (!node.value) return;
  if (canConfirmEdit(tempKey.value, node.value.key)) {
    desk.confirmEditKey(node.value);
  }
  inputRef.value?.blur();
};

const cancelEdit = () => {
  if (!node.value) return;
  desk.cancelEditKey(node.value);
  inputRef.value?.blur();
};
</script>

<template>
  <div
    v-if="node"
    data-slot="ot-key-editor"
    :class="
      cn(
        'node-key-editor',
        canEdit ? 'node-key-editor-editable' : 'node-key-editor-readonly',
        props.class
      )
    "
    :style="props.style"
    @click="canEdit && !isEditing && startEdit()"
  >
    <input
      v-if="isEditing"
      ref="inputRef"
      :value="tempKey || ''"
      :style="{ width: inputWidth }"
      class="ot-key-input"
      @input="(e) => updateTempKey((e.target as HTMLInputElement).value)"
      @keyup.enter="confirmEdit()"
      @keyup.esc="cancelEdit()"
      @click.stop
    />
    <span v-else :class="keyClasses">{{ displayKey }}</span>
  </div>
</template>

