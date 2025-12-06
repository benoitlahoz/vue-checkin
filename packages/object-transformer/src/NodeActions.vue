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
    class="ot-actions-container"
    :class="isVisible ? 'ot-actions-visible' : 'ot-actions-hidden'"
  >
    <button
      class="ot-actions-button"
      :title="node.deleted ? 'Restore property' : 'Delete property'"
      @click.stop="toggleDelete()"
    >
      <Undo v-if="node.deleted" class="ot-actions-icon" />
      <Trash v-else class="ot-actions-icon ot-actions-icon-delete" />
    </button>
  </div>
</template>
