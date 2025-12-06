<script setup lang="ts">
import { computed, ref } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useCheckIn, partition } from 'vue-airport';
import {
  NodeKeyEditor,
  NodeActions,
  NodeOpen,
  NodeTransformsList,
  type ObjectNodeData,
  type ObjectTransformerContext,
  ObjectTransformerDeskKey,
  computeFinalTransformedValue,
  filterTransformsByType,
  applyNodeTransform,
} from '@vue-airport/object-transformer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus } from 'lucide-vue-next';

interface Props {
  id?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  id: null,
});

const { checkIn } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey);
const deskWithContext = desk as typeof desk & ObjectTransformerContext;

// Get the node
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

const nodeId = computed(() => tree.value.id);
const isOpen = computed(() => tree.value.isOpen ?? true);
const editingKey = computed(() => deskWithContext.editingNode.value === tree.value);
const isHovered = ref(false);
const inputElement = ref<HTMLElement | null>(null);

onClickOutside(inputElement, () => {
  if (editingKey.value) {
    deskWithContext.confirmEditKey(tree.value);
    isHovered.value = false;
  }
});

const getChildKey = (child: ObjectNodeData, index: number) =>
  deskWithContext.generateChildKey(child, index);

const shouldShowChildren = computed(() => {
  if (!tree.value.children?.length) return false;
  if (!tree.value.transforms?.length) return true;
  const finalValue = computeFinalTransformedValue(tree.value);
  const finalType = typeof finalValue;
  return finalType === 'object' && finalValue !== null;
});

const displayValue = computed(() => {
  if (tree.value.transforms && tree.value.transforms.length > 0) {
    return computeFinalTransformedValue(tree.value);
  }
  return tree.value.value;
});

const isRootNode = (node: any) => {
  return node.parent === null || node.parent === undefined;
};

// Get available transforms for this node
const availableTransforms = computed(() => {
  if (!tree.value) return [];
  const nodeType = tree.value.type;
  return filterTransformsByType(deskWithContext.transforms.value, nodeType);
});

// Categorize transforms
const transformsPartition = computed(() =>
  partition(
    availableTransforms.value.filter((t) => !t.condition),
    (t) => t.structural === true
  )
);

const structuralTransforms = computed(() => transformsPartition.value[0]);
const regularTransforms = computed(() => transformsPartition.value[1]);
const availableConditions = computed(() =>
  availableTransforms.value.filter((t) => t.condition !== undefined)
);

// Apply transform handler
const handleApplyTransform = (transformName: string | null) => {
  if (!tree.value) return;
  applyNodeTransform(tree.value, transformName, deskWithContext, null);
};
</script>

<template>
  <div class="ot-node-root">
    <!-- Custom node layout -->
    <div
      class="flex items-start gap-2 py-1 px-2 rounded transition-colors duration-150"
      :class="{
        'bg-slate-100 dark:bg-slate-800': isHovered && !tree.deleted,
        'opacity-50': tree.deleted,
      }"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <!-- Open/Close icon -->
      <NodeOpen v-if="shouldShowChildren" :node-id="nodeId" class="shrink-0 mt-0.5" />
      <div v-else class="w-4 shrink-0" />

      <!-- Delete/Restore actions (hidden for root) -->
      <NodeActions
        v-if="!isRootNode(tree)"
        :node-id="nodeId"
        :is-visible="isHovered"
        class="shrink-0 mt-0.5"
      />
      <div v-else class="w-4 shrink-0" />

      <!-- Key editor (hidden for root) -->
      <NodeKeyEditor
        v-if="!isRootNode(tree)"
        :node-id="nodeId"
        :is-editing="editingKey"
        class="shrink-0"
      />
      <span v-else class="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
        {{ Array.isArray(tree.value) ? 'Array' : 'Object' }}
      </span>

      <!-- Value display -->
      <div class="flex-1 min-w-0 flex flex-col gap-1">
        <!-- Type badge (only for non-root) -->
        <div v-if="!isRootNode(tree)" class="flex items-center gap-2 flex-wrap">
          <span
            class="font-mono text-xs px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300"
            :class="{
              'bg-blue-100 dark:bg-blue-900/30': typeof displayValue === 'string',
              'bg-purple-100 dark:bg-purple-900/30': typeof displayValue === 'number',
              'bg-green-100 dark:bg-green-900/30': typeof displayValue === 'boolean',
              'bg-orange-100 dark:bg-orange-900/30': displayValue instanceof Date,
              'bg-slate-200 dark:bg-slate-700': typeof displayValue === 'object',
            }"
          >
            {{
              typeof displayValue === 'object' && displayValue !== null
                ? Array.isArray(displayValue)
                  ? 'array'
                  : 'object'
                : typeof displayValue
            }}
          </span>
          <span
            v-if="typeof displayValue !== 'object'"
            class="font-mono text-xs text-slate-600 dark:text-slate-400 truncate"
          >
            {{ displayValue }}
          </span>
        </div>

        <!-- Transforms with custom dropdown (hidden for root) -->
        <NodeTransformsList v-if="!isRootNode(tree)" :node-id="nodeId" class="text-xs">
          <template
            #default="{ node: transformNode, transforms, helpers, components: transformComponents }"
          >
            <div class="flex flex-col gap-2">
              <!-- Add Transform Dropdown -->
              <DropdownMenu>
                <DropdownMenuTrigger
                  class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 w-fit"
                  :disabled="transformNode?.deleted || false"
                >
                  <Plus class="w-3 h-3" />
                  <span>Add Transform</span>
                  <ChevronDown class="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-56">
                  <!-- Remove All Transforms -->
                  <DropdownMenuItem
                    v-if="transforms.length > 0"
                    class="text-xs cursor-pointer text-red-600 dark:text-red-400"
                    @click="handleApplyTransform(null)"
                  >
                    <span>Remove All</span>
                  </DropdownMenuItem>

                  <!-- Transformations -->
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger class="text-xs">
                      <span>Transformations</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        v-for="transform in regularTransforms"
                        :key="transform.name"
                        class="text-xs cursor-pointer"
                        @click="handleApplyTransform(transform.name)"
                      >
                        <span>{{ transform.name }}</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <!-- Structural -->
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger class="text-xs">
                      <span>Structural</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        v-for="transform in structuralTransforms"
                        :key="transform.name"
                        class="text-xs cursor-pointer"
                        @click="handleApplyTransform(transform.name)"
                      >
                        <span>{{ transform.name }}</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <!-- Conditions -->
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger class="text-xs">
                      <span>Conditions</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        v-for="transform in availableConditions"
                        :key="transform.name"
                        class="text-xs cursor-pointer"
                        @click="handleApplyTransform(transform.name)"
                      >
                        <span>{{ transform.name }}</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              <!-- Existing transforms -->
              <div
                v-for="(t, index) in transforms"
                :key="`${t.name}-${index}`"
                class="flex flex-col gap-1 pl-2 border-l-2 border-slate-200 dark:border-slate-700"
              >
                <div class="flex items-center gap-2 text-xs">
                  <span class="font-semibold text-blue-600 dark:text-blue-400">{{ t.name }}</span>
                  <span class="text-slate-600 dark:text-slate-400">→</span>
                  <span class="font-mono text-slate-900 dark:text-slate-100">
                    {{ helpers.formatStepValue(index) }}
                  </span>
                </div>

                <!-- Parameters -->
                <div v-if="helpers.hasParams(t.name)" class="flex flex-col gap-1">
                  <div
                    v-for="(_p, pi) in t.params"
                    :key="`param-${index}-${pi}`"
                    class="flex items-center gap-2"
                  >
                    <label class="text-xs text-slate-600 dark:text-slate-400">
                      {{ helpers.getParamConfig(t.name, pi)?.label || `Param ${pi + 1}` }}:
                    </label>
                    <component
                      :is="transformComponents.TransformerParamInput"
                      v-model="t.params![pi]"
                      :config="helpers.getParamConfig(t.name, pi)"
                      class="flex-1"
                      @change="helpers.handleParamChange()"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </NodeTransformsList>
      </div>
    </div>

    <!-- Recursive children with SAME component -->
    <div v-if="shouldShowChildren && isOpen" class="ot-node-indent">
      <CustomRecursiveNode
        v-for="(child, index) in tree.children"
        :id="child.id"
        :key="getChildKey(child, index)"
      />
    </div>
  </div>
</template>
