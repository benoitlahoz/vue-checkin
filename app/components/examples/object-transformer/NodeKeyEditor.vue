<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import { Input } from '@/components/ui/input';
import type { ObjectNode, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey } from '.';
import { shouldStartEdit, canConfirmEdit } from './utils/node-editing.util';

interface Props {
  nodeId: string;
}

const props = defineProps<Props>();

const { checkIn } = useCheckIn<ObjectNode, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

// Get node from desk
const node = computed(() => desk!.getNode(props.nodeId));
const isEditing = computed(() => desk!.editingNode.value === node.value);
const tempKey = computed(() => desk!.tempKey.value);
const keyClasses = computed(() => (node.value ? desk!.getKeyClasses(node.value) : ''));

const inputRef = defineModel<InstanceType<typeof Input> | null>('inputRef');

const startEdit = () => {
  if (!node.value) return;
  if (shouldStartEdit(node.value, desk!.editingNode.value)) {
    desk!.startEditKey(node.value);
  }
};

const updateTempKey = (value: string) => {
  desk!.tempKey.value = value;
};

const confirmEdit = () => {
  if (!node.value) return;
  if (canConfirmEdit(tempKey.value, node.value.key)) {
    desk!.confirmEditKey(node.value);
  }
  inputRef.value?.$el?.blur();
};

const cancelEdit = () => {
  if (!node.value) return;
  desk!.cancelEditKey(node.value);
  inputRef.value?.$el?.blur();
};
</script>

<template>
  <div
    v-if="node"
    class="cursor-pointer flex items-center gap-2"
    @click="!isEditing && startEdit()"
  >
    <Input
      v-if="isEditing"
      ref="inputRef"
      :model-value="tempKey || ''"
      class="h-6 px-2 py-0 text-xs"
      autofocus
      @update:model-value="(val) => updateTempKey(String(val))"
      @keyup.enter="confirmEdit()"
      @keyup.esc="cancelEdit()"
      @click.stop
    />
    <span v-else :class="keyClasses">{{ node.key }}</span>
  </div>
</template>
