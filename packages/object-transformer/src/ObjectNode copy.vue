<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCheckIn } from 'vue-airport';
import {
  DefaultObjectNodeRender,
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

// Layout helpers
const valueElement = ref<HTMLElement | null>(null);
const firstChildElement = ref<HTMLElement | null>(null);
const inputElement = ref<HTMLElement | null>(null);
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

// Exposed slot props
const slotProps = computed(() => ({
  node: tree.value,
  nodeId: nodeId.value,
  state: {
    isOpen: isOpen.value,
    isPrimitive: isPrimitive.value,
    isEditing: editingKey.value,
    isHovered: isHovered.value,
  },
  components: {
    NodeOpen,
    NodeActions,
    NodeKeyEditor,
    TransformSelect,
    NodeTransformsList,
    Separator,
  },
  utils: {
    formatValue,
    getChildKey,
    isPrimitive: isPrimitiveType,
  },
  refs: {
    valueElement,
    firstChildElement,
    inputElement,
  },
  computed: {
    transformsPaddingLeft: transformsPaddingLeft.value,
  },
  handlers: {
    onMouseEnter: () => (isHovered.value = true),
    onMouseLeave: () => !editingKey.value && (isHovered.value = false),
  },
  desk: deskWithContext,
}));
</script>

<template>
  <div
    data-slot="object-node"
    class="text-xs object-node-root flex-1"
    :class="[{ 'opacity-50': tree.deleted }, props.class]"
  >
    <slot v-bind="slotProps">
      <!-- Default render -->
      <DefaultObjectNodeRender
        :node="tree"
        :desk-with-context="deskWithContext"
        :is-open="isOpen"
        :is-primitive="isPrimitive"
        :editing-key="editingKey"
        :is-hovered="isHovered"
        :transforms-padding-left="transformsPaddingLeft"
        :get-child-key="getChildKey"
        @update:is-hovered="isHovered = $event"
      />
    </slot>
  </div>
</template>
