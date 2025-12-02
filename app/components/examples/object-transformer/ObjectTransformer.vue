<script setup lang="ts">
import { ref, type HTMLAttributes } from 'vue';
import { useCheckIn } from 'vue-airport';
import { cn } from '@/lib/utils';
import {
  ObjectTransformerDeskKey,
  type ObjectNodeData,
  type ObjectNodeType,
  type Transform,
  type ObjectTransformerContext,
  type ObjectTransformerDesk,
  buildNodeTree,
  computeIntermediateValue,
  computeStepValue,
  createPropagateTransform,
  getTypeFromValue,
  sanitizeKey,
  autoRenameKey,
  handleRestoreConflict,
  formatValue,
  isAddedProperty,
  getKeyClasses,
  generateChildKey,
  keyGuards,
  buildRecipe as buildRecipeUtil,
  applyRecipe as applyRecipeUtil,
  exportRecipe as exportRecipeUtil,
  importRecipe as importRecipeUtil,
  validateRecipeTransforms as validateRecipeTransformsUtil,
} from '.';

export interface ObjectTransformerProps {
  data?: Record<string, any> | any[];
  forbiddenKeys?: string[];
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<ObjectTransformerProps>(), {
  data: () => ({}),
  forbiddenKeys: () => keyGuards,
  class: '',
});

const { createDesk } = useCheckIn<ObjectNodeData, ObjectTransformerContext>();
const { desk } = createDesk(ObjectTransformerDeskKey, {
  devTools: true,
  context: {
    // Tree
    tree: ref<ObjectNodeData>(
      buildNodeTree(props.data, Array.isArray(props.data) ? 'Array' : 'Object')
    ),
    originalData: ref(props.data),
    getNode(id: string): ObjectNodeData | null {
      // Recursive search in the tree
      const findNode = (node: ObjectNodeData): ObjectNodeData | null => {
        if (node.id === id) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNode(child);
            if (found) return found;
          }
        }
        return null;
      };
      return findNode(this.tree.value);
    },

    // Constants
    primitiveTypes: [
      'string',
      'number',
      'boolean',
      'bigint',
      'symbol',
      'undefined',
      'null',
      'date',
      'function',
    ] as ObjectNodeType[],

    // Transforms
    transforms: ref<Transform[]>([]),
    addTransforms(...newTransforms: Transform[]) {
      this.transforms.value.push(...newTransforms);
    },
    findTransform(name: string, node?: ObjectNodeData): Transform | undefined {
      // If node is provided, filter by type compatibility
      if (node) {
        return this.transforms.value.find((t) => t.name === name && t.if(node));
      }
      return this.transforms.value.find((t) => t.name === name);
    },
    initParams(transform: Transform) {
      // Extract default VALUES from param configs
      return transform.params?.map((p) => p.default ?? null) || [];
    },
    createTransformEntry(name: string, node?: ObjectNodeData) {
      const transform = this.findTransform(name, node);
      if (!transform) return null;

      // Create a copy with params as VALUES array (not configs)
      return {
        ...transform,
        params: this.initParams(transform),
      };
    },
    propagateTransform(node: ObjectNodeData) {
      const propagate = createPropagateTransform(desk as ObjectTransformerDesk);
      propagate(node);
    },
    computeStepValue,

    // Nodes
    forbiddenKeys: ref<string[]>(props.forbiddenKeys || keyGuards),
    getComputedValueType(_node: ObjectNodeData, value: any): ObjectNodeType {
      return getTypeFromValue(value);
    },

    // Key editing
    editingNode: ref<ObjectNodeData | null>(null),
    tempKey: ref<string | null>(null),
    startEditKey(node: ObjectNodeData) {
      this.editingNode.value = node;
      this.tempKey.value = node.key || null;
    },
    confirmEditKey(node: ObjectNodeData) {
      const newKey = this.tempKey.value?.trim();

      if (!newKey || !sanitizeKey(newKey)) {
        this.tempKey.value = node.key || null;
        this.editingNode.value = null;
        return;
      }

      if (newKey === node.key) {
        this.editingNode.value = null;
        return;
      }

      const parent = node.parent;
      if (parent?.type === 'object' && parent.children) {
        const finalKey = autoRenameKey(parent, newKey);

        // Store original key before renaming
        if (!node.originalKey) {
          node.originalKey = node.key;
        }

        node.key = finalKey;
        node.keyModified = true;
        this.tempKey.value = finalKey;
        this.propagateTransform(parent);
      }

      this.editingNode.value = null;
    },
    cancelEditKey(node: ObjectNodeData) {
      this.tempKey.value = node.key || null;
      this.editingNode.value = null;
    },

    // Node utilities (using pure functions)
    isAddedProperty,
    getKeyClasses,
    generateChildKey,
    toggleNodeDeletion(node: ObjectNodeData) {
      const wasDeleted = node.deleted;
      node.deleted = !node.deleted;

      // If restoring a node, check for conflicts with added properties
      if (wasDeleted && !node.deleted && node.parent) {
        handleRestoreConflict(node.parent, node);
      }

      if (node.parent) {
        this.propagateTransform(node.parent);
      }
    },

    // Transform selections
    nodeSelections: new WeakMap<ObjectNodeData, string | null>(),
    stepSelections: new WeakMap<ObjectNodeData, Record<number, string | null>>(),
    getNodeSelection(node: ObjectNodeData): string | null {
      // If node has no transforms, always return null
      if (node.transforms.length === 0) {
        this.nodeSelections.set(node, null);
        return null;
      }

      // Always sync with the FIRST transform (index 0)
      const firstTransformName = node.transforms[0]?.name || null;
      this.nodeSelections.set(node, firstTransformName);
      return firstTransformName;
    },
    setNodeSelection(node: ObjectNodeData, value: string | null) {
      this.nodeSelections.set(node, value);
    },
    getStepSelection(node: ObjectNodeData): Record<number, string | null> {
      if (!this.stepSelections.has(node)) {
        this.stepSelections.set(node, {});
      }

      const currentSelections = this.stepSelections.get(node) || {};

      // Clean up selections for indices beyond the number of transforms
      const cleanedSelections: Record<number, string | null> = {};
      Object.entries(currentSelections).forEach(([key, value]) => {
        const idx = parseInt(key);
        // Keep only selections for valid transform indices
        if (idx < node.transforms.length) {
          cleanedSelections[idx] = value;
        }
      });

      this.stepSelections.set(node, cleanedSelections);
      return cleanedSelections;
    },
    setStepSelection(node: ObjectNodeData, value: Record<number, string | null>) {
      this.stepSelections.set(node, value);
    },

    // Helpers
    getParamConfig(transformName: string, paramIndex: number) {
      return this.transforms.value.find((x) => x.name === transformName)?.params?.[paramIndex];
    },
    formatStepValue(node: ObjectNodeData, index: number): string {
      const value = this.computeStepValue(node, index);
      const type = this.getComputedValueType(node, value);
      return formatValue(value, type);
    },
    isStructuralTransform(node: ObjectNodeData, transformIndex: number): boolean {
      const t = node.transforms[transformIndex];
      if (!t) return false;

      const value = computeIntermediateValue(node);
      const result = t.fn(value, ...(t.params || []));

      return result && typeof result === 'object' && result.__structuralChange === true;
    },

    // Recipe management
    recipe: ref(null),
    buildRecipe() {
      const recipe = buildRecipeUtil(this.tree.value);
      this.recipe.value = recipe;
      return recipe;
    },
    applyRecipe(data: any, recipe) {
      return applyRecipeUtil(data, recipe, this.transforms.value);
    },
    exportRecipe() {
      const recipe = this.recipe.value || this.buildRecipe();
      return exportRecipeUtil(recipe);
    },
    importRecipe(recipeJson: string) {
      const recipe = importRecipeUtil(recipeJson);

      // Validate that all required transforms are available
      const missingTransforms = validateRecipeTransformsUtil(recipe, this.transforms.value);
      if (missingTransforms.length > 0) {
        throw new Error(
          `Missing required transforms: ${missingTransforms.join(', ')}. ` +
            `Please add the corresponding transform components to the ObjectTransformer.`
        );
      }

      this.recipe.value = recipe;

      // Apply recipe to original data and rebuild tree
      const transformedData = applyRecipeUtil(
        this.originalData.value,
        recipe,
        this.transforms.value
      );
      this.tree.value = buildNodeTree(
        transformedData,
        Array.isArray(transformedData) ? 'Array' : 'Object'
      );
    },
  },
});

watch(
  () => props.data,
  (newData) => {
    (desk as ObjectTransformerDesk).originalData.value = newData;
    (desk as ObjectTransformerDesk).tree.value = buildNodeTree(
      newData,
      Array.isArray(newData) ? 'Array' : 'Object'
    );
  },
  { deep: true }
);
</script>

<template>
  <div data-slot="object-transformer" :class="cn('flex flex-col gap-4', props.class)">
    <slot />
  </div>
</template>
