<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue';
import { useCheckIn } from 'vue-airport';
import {
  TransformerNode,
  NodeKeyEditor,
  NodeActions,
  TransformSelect,
  NodeTransformsList,
  type ObjectNode,
  type ObjectTransformerContext,
  ObjectTransformerDeskKey,
  filterTransformsByType,
  applyNodeTransform,
  createClickOutsideChecker,
} from '.';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import { isPrimitive as isPrimitiveType } from './utils/type-guards.util';
import { formatValue } from './utils/node-utilities.util';

type DeskWithContext = typeof desk & ObjectTransformerContext;

interface Props {
  id?: string | null; // null = root
}

const props = withDefaults(defineProps<Props>(), {
  id: null,
});

const { checkIn } = useCheckIn<ObjectNode, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);
const deskWithContext = desk as DeskWithContext;

// Get the node from the desk
const tree = computed(() => {
  if (props.id === null) {
    return deskWithContext.tree.value;
  }
  const node = deskWithContext.getNode(props.id);
  if (!node) {
    console.warn('Node not found:', props.id);
    return deskWithContext.tree.value;
  }
  return node;
});

// Computed node ID for sub-components
const nodeId = computed(() => tree.value.id);

// The node's type is the ORIGINAL type (set in buildNodeTree, never changed)
const originalType = tree.value.type;

// Available transforms
const availableTransforms = computed(() =>
  filterTransformsByType(deskWithContext.transforms.value, originalType)
);

// State
const isOpen = ref(tree.value.isOpen ?? true);
const isPrimitive = computed(() => isPrimitiveType(tree.value.type));
const editingKey = computed(() => deskWithContext.editingNode.value === tree.value);
const isHovered = ref(false);
const inputFieldElement = ref<any>(null);

// Toggle open/close
const toggleOpen = () => {
  isOpen.value = !isOpen.value;
  tree.value.isOpen = isOpen.value;
};

// Selections
const nodeSelect = computed({
  get: () => deskWithContext.getNodeSelection(tree.value),
  set: (value) => deskWithContext.setNodeSelection(tree.value, value),
});
const stepSelect = computed({
  get: () => {
    // Add dependency on transforms length to trigger recalculation
    const _ = tree.value.transforms.length;
    return deskWithContext.getStepSelection(tree.value);
  },
  set: (value) => deskWithContext.setStepSelection(tree.value, value),
});

// Click outside handling
const inputElement = ref<HTMLElement | null>(null);
const buttonElement = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (!editingKey.value) return;
  const checker = createClickOutsideChecker(inputElement.value, buttonElement.value);
  if (checker(event)) {
    deskWithContext.confirmEditKey(tree.value);
    isHovered.value = false;
  }
};

watch(editingKey, (isEditing) => {
  if (isEditing) {
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Layout helpers
const valueElement = ref<HTMLElement | null>(null);
const firstChildElement = ref<HTMLElement | null>(null);
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

  // Pour les objects/arrays, utiliser le premier enfant
  if (!isPrimitive.value && firstChildElement.value) {
    const rect = firstChildElement.value.getBoundingClientRect();
    const containerEl = firstChildElement.value.closest('.transformer-node-root');
    if (!containerEl) return '0px';
    const containerRect = containerEl.getBoundingClientRect();
    const offset = rect.left - containerRect.left;
    return `${offset}px`;
  }

  return '0px';
});

// Transform handlers
const handleNodeTransform = (name: unknown) => {
  applyNodeTransform(tree.value, name as string | null, deskWithContext, nodeSelect.value);

  if (name === 'None') {
    nodeSelect.value = null;
    stepSelect.value = {};
  } else if (typeof name === 'string') {
    nodeSelect.value = name;
  }
};

// Utilities from desk
const getChildKey = (child: ObjectNode, index: number) =>
  deskWithContext.generateChildKey(child, index);
</script>

<template>
  <div class="text-xs transformer-node-root" :class="{ 'opacity-50': tree.deleted }">
    <!-- Wrapper avec scroll horizontal -->
    <div class="overflow-x-auto">
      <div
        class="flex items-center justify-between gap-2 my-1 ml-2 transition-all group hover:bg-accent/30 min-w-fit"
      >
        <!-- Partie gauche : chevron + delete + key + value -->
        <div class="flex items-center gap-2">
          <template v-if="tree.children?.length">
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
          </template>
          <div v-else class="w-3 shrink-0" />

          <!-- Conteneur pour bouton + nom avec hover commun -->
          <div
            ref="firstChildElement"
            class="flex items-center transition-all group-hover:border-l-2 group-hover:border-primary group-hover:pl-2.5 -ml-0.5 pl-1.5"
            @mouseenter="isHovered = true"
            @mouseleave="!editingKey && (isHovered = false)"
          >
            <!-- Bouton Delete/Restore -->
            <div
              v-if="tree.parent?.type === 'object' || tree.parent?.type === 'array'"
              ref="buttonElement"
            >
              <NodeActions :node-id="nodeId" :is-visible="isHovered || editingKey" />
            </div>

            <!-- NodeKey Component -->
            <div ref="inputElement">
              <NodeKeyEditor v-model:input-ref="inputFieldElement" :node-id="nodeId" />
            </div>

            <!-- Value (lecture seule) - masquée pour object/array -->
            <span
              v-if="tree.type !== 'object' && tree.type !== 'array'"
              ref="valueElement"
              class="ml-2 text-muted-foreground"
            >
              {{ formatValue(tree.value, tree.type) }}
            </span>
            <span v-else ref="valueElement" class="hidden" />
          </div>
        </div>

        <!-- Partie droite : select de transformation -->
        <div v-if="availableTransforms.length" class="shrink-0 md:ml-auto">
          <TransformSelect
            v-model="nodeSelect"
            :transforms="availableTransforms"
            @update:model-value="handleNodeTransform"
          />
        </div>
      </div>
    </div>

    <!-- Enfants récursifs AVANT les transformations pour object/array -->
    <div v-if="tree.children?.length && isOpen" class="ml-3.5 border-l border-border pl-0">
      <TransformerNode
        v-for="(child, index) in tree.children"
        :id="child.id"
        :key="getChildKey(child, index)"
      />
    </div>

    <!-- Séparateur si enfants et transformations -->
    <Separator v-if="tree.children?.length && tree.transforms.length" class="my-2 md:hidden" />

    <!-- Transformations + paramètres (APRÈS les enfants) -->
    <NodeTransformsList
      v-if="tree.transforms.length"
      :node-id="nodeId"
      :padding-left="transformsPaddingLeft"
    />
  </div>
</template>
