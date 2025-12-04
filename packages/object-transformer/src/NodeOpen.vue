<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import type { ObjectNodeData, ObjectTransformerContext } from '.';
import { ObjectTransformerDeskKey } from '.';

interface Props {
  nodeId: string;
}

const props = defineProps<Props>();

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

if (!desk) {
  throw new Error('ObjectTransformer desk not found');
}

const node = computed(() => desk.getNode(props.nodeId));

const isOpen = computed({
  get: () => node.value?.isOpen ?? true,
  set: (value) => {
    if (node.value) {
      node.value.isOpen = value;
    }
  },
});

const hasChildren = computed(() => (node.value?.children?.length ?? 0) > 0);

const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};
</script>

<template>
  <template v-if="hasChildren">
    <div data-slot="node-open">
      <ChevronRight
        v-if="!isOpen"
        class="w-3 h-3 text-muted-foreground cursor-pointer shrink-0"
        @click="toggleOpen"
      />
      <ChevronDown
        v-else-if="isOpen"
        class="w-3 h-3 text-muted-foreground cursor-pointer shrink-0"
        @click="toggleOpen"
      />
    </div>
  </template>
  <div v-else class="w-3 shrink-0" data-slot="node-open" />
</template>
