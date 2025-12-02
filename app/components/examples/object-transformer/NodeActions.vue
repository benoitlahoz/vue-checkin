<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import { Button } from '@/components/ui/button';
import { Undo, Trash } from 'lucide-vue-next';
import type { ObjectNode, ObjectTransformerContext } from './index';
import { ObjectTransformerDeskKey } from './index';

interface Props {
  nodeId: string;
  isVisible: boolean;
}

const props = defineProps<Props>();

const { checkIn } = useCheckIn<ObjectNode, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);

const node = computed(() => desk!.getNode(props.nodeId));

const toggleDelete = () => {
  if (!node.value) return;
  desk!.toggleNodeDeletion(node.value);
};
</script>

<template>
  <div
    v-if="node"
    class="overflow-hidden transition-all duration-200"
    :class="isVisible ? 'w-4 mr-1.5' : 'w-0'"
  >
    <Button
      variant="ghost"
      size="icon"
      class="h-4 w-4 p-0 shrink-0"
      :title="node.deleted ? 'Restore property' : 'Delete property'"
      @click.stop="toggleDelete()"
    >
      <Undo v-if="node.deleted" class="w-3.5 h-3.5 text-muted-foreground" />
      <Trash v-else class="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
    </Button>
  </div>
</template>
