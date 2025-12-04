<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import { Undo, Trash } from 'lucide-vue-next';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey } from '.';

interface Props {
  nodeId: string;
  isVisible: boolean;
}

const props = defineProps<Props>();

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

if (!desk) {
  throw new Error('ObjectTransformer desk not found');
}

const node = computed(() => desk.getNode(props.nodeId));

const toggleDelete = () => {
  if (!node.value) return;
  desk.toggleNodeDeletion(node.value);
};
</script>

<template>
  <div
    v-if="node"
    data-slot="node-actions"
    class="node-actions-container"
    :class="isVisible ? 'node-actions-visible' : 'node-actions-hidden'"
  >
    <button
      class="node-actions-button"
      :title="node.deleted ? 'Restore property' : 'Delete property'"
      @click.stop="toggleDelete()"
    >
      <Undo v-if="node.deleted" class="node-actions-icon" />
      <Trash v-else class="node-actions-icon node-actions-icon-delete" />
    </button>
  </div>
</template>

<style>
/* NodeActions styles - using ObjectNode variables */
.node-actions-container {
  overflow: hidden;
  transition-property: width;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.node-actions-visible {
  width: 1rem;
  margin-right: 0.375rem;
}

.node-actions-hidden {
  width: 0;
}

.node-actions-button {
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

.node-actions-button:hover {
  opacity: 0.8;
}

.node-actions-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--object-node-muted-foreground);
  transition-property: color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.node-actions-icon-delete:hover {
  color: var(--object-node-destructive, #ef4444);
}

.node-actions-button:has(.node-actions-icon:not(.node-actions-icon-delete)):hover
  .node-actions-icon {
  color: var(--object-node-primary);
}
</style>
