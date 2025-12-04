<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ObjectNode,
  NodeKeyEditor,
  NodeActions,
  NodeOpen,
  TransformSelect,
  NodeTransformsList,
  type ObjectNodeData,
} from '.';
import { Separator } from './components/ui/separator';
import { formatValue } from '.';

interface Props {
  node: ObjectNodeData;
  deskWithContext: any;
  isOpen: boolean;
  isPrimitive: boolean;
  editingKey: boolean;
  isHovered: boolean;
  transformsPaddingLeft: string;
  getChildKey: (child: ObjectNodeData, index: number) => string;
}

const props = defineProps<Props>();

defineEmits<{
  'update:isHovered': [value: boolean];
}>();

const nodeId = computed(() => props.node.id);

// Local refs for layout calculations
const valueElement = ref<HTMLElement | null>(null);
const firstChildElement = ref<HTMLElement | null>(null);
const inputElement = ref<HTMLElement | null>(null);
</script>

<template>
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
          @mouseenter="$emit('update:isHovered', true)"
          @mouseleave="!editingKey && $emit('update:isHovered', false)"
        >
          <!-- Delete/Restore -->
          <div v-if="node.parent?.type === 'object' || node.parent?.type === 'array'">
            <NodeActions :node-id="nodeId" :is-visible="isHovered || editingKey" />
          </div>

          <!-- NodeKey Component -->
          <div ref="inputElement">
            <NodeKeyEditor :node-id="nodeId" />
          </div>

          <!-- Value (read-only) -->
          <span
            v-if="node.type === 'array'"
            ref="valueElement"
            class="ml-2 text-muted-foreground italic"
          >
            Array({{ node.children?.length || 0 }})
          </span>
          <span
            v-else-if="node.type !== 'object'"
            ref="valueElement"
            class="ml-2 text-muted-foreground"
          >
            {{ formatValue(node.value, node.type) }}
          </span>
          <span v-else ref="valueElement" class="hidden" />
        </div>
      </div>

      <!-- Right part: transformation select -->
      <TransformSelect v-if="node.parent" :node-id="nodeId" class="shrink-0 md:ml-auto" />
    </div>
  </div>

  <!-- Recursive children -->
  <div v-if="node.children?.length && isOpen">
    <ObjectNode
      v-for="(child, index) in node.children"
      :id="child.id"
      :key="getChildKey(child, index)"
    />
  </div>

  <Separator v-if="node.children?.length && node.transforms.length" class="my-2 md:hidden" />

  <!-- Transformations + parameters -->
  <NodeTransformsList
    v-if="node.transforms.length"
    :node-id="nodeId"
    :padding-left="transformsPaddingLeft"
  />
</template>
