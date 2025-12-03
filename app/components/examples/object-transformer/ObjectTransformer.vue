<script setup lang="ts">
import { ref, triggerRef, type HTMLAttributes } from 'vue';
import { useCheckIn } from 'vue-airport';
import { cn } from '@/lib/utils';
import {
  ObjectTransformerDeskKey,
  type ObjectNodeData,
  type ObjectNodeType,
  type Transform,
  type ObjectTransformerContext,
  type ObjectTransformerDesk,
  type TransformerMode,
  buildNodeTree,
  computeIntermediateValue,
  computeStepValue,
  createPropagateTransform,
  getTypeFromValue,
  sanitizeKey,
  autoRenameKey,
  findUniqueKey,
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
  findMostCompleteObject,
  suggestModelMode,
  getDataForMode,
  extractModelRules as extractModelRulesUtil,
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

// Auto-detect mode
const initialMode: TransformerMode = suggestModelMode(props.data) ? 'model' : 'object';
const initialTemplateIndex =
  initialMode === 'model' && Array.isArray(props.data) ? findMostCompleteObject(props.data) : 0;

// Get data based on mode
const initialData = getDataForMode(props.data, initialMode, initialTemplateIndex);

const { desk } = createDesk(ObjectTransformerDeskKey, {
  devTools: true,
  context: {
    // Tree
    tree: ref<ObjectNodeData>(
      buildNodeTree(initialData, Array.isArray(props.data) ? 'Array' : 'Object')
    ),
    triggerTreeUpdate() {
      triggerRef(this.tree);
    },
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

    // Mode
    mode: ref<TransformerMode>(initialMode),
    setMode(newMode: TransformerMode) {
      this.mode.value = newMode;

      // Rebuild tree with appropriate data
      const data = getDataForMode(this.originalData.value, newMode, this.templateIndex.value);
      this.tree.value = buildNodeTree(
        data,
        Array.isArray(this.originalData.value) ? 'Array' : 'Object'
      );
    },
    templateIndex: ref<number>(initialTemplateIndex),
    setTemplateIndex(index: number) {
      if (!Array.isArray(this.originalData.value)) return;

      this.templateIndex.value = index;

      // Rebuild tree with new template object
      if (this.mode.value === 'model') {
        const data = getDataForMode(this.originalData.value, this.mode.value, index);
        this.tree.value = buildNodeTree(data, 'Object');
      }
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
      this.triggerTreeUpdate(); // Trigger reactivity after any transform change
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
        // Check if we're restoring to original key
        const isRestoringToOriginal = node.originalKey === newKey;

        // Find conflicting node (same key but different node)
        // Ignore deleted nodes in conflict detection
        const conflictingNode = parent.children.find(
          (c) => c !== node && c.key === newKey && !c.deleted
        );

        // Also check if there's a deleted node with this key
        // If we're renaming to a deleted node's key, we should take over that position
        const deletedNodeWithKey = parent.children.find(
          (c) => c !== node && c.key === newKey && c.deleted
        );

        if (conflictingNode && isRestoringToOriginal) {
          // We're restoring to original key - rename the conflicting node instead

          // Store original key of conflicting node BEFORE changing it
          if (!conflictingNode.originalKey) {
            conflictingNode.originalKey = conflictingNode.key;
          }

          const existingKeys = new Set(
            parent.children
              .filter((c) => !c.deleted && c !== conflictingNode)
              .map((c) => c.key)
              .filter((k): k is string => Boolean(k))
          );
          const uniqueKey = findUniqueKey(existingKeys, newKey, 1);

          conflictingNode.key = uniqueKey;
          conflictingNode.keyModified = true;

          // Restore this node to original key
          node.key = newKey;
          node.keyModified = false; // No longer modified since we're back to original
          node.originalKey = undefined; // Clear original key

          // Propagate both nodes to update recipe
          if (conflictingNode.transforms && conflictingNode.transforms.length > 0) {
            this.propagateTransform(conflictingNode);
          }
        } else {
          // Normal rename - use autoRenameKey to avoid conflicts
          const oldKey = node.key;

          // If there's a deleted node with the target key, we're taking over that key
          // The deleted node will need to be auto-renamed if it's ever restored
          const finalKey = deletedNodeWithKey ? newKey : autoRenameKey(parent, newKey);

          // Store original key before renaming (only if not already stored)
          if (!node.originalKey && oldKey !== finalKey) {
            node.originalKey = oldKey;
          }

          node.key = finalKey;
          node.keyModified = true;

          // IMPORTANT: When renaming a node with children (like name_object -> name),
          // we need to update the originalKey of all descendants so the recipe
          // can track the path changes correctly
          if (node.children && node.children.length > 0) {
            this.updateDescendantPaths(node, oldKey, finalKey);
          }
        }

        this.tempKey.value = node.key;
        this.propagateTransform(parent);
        this.triggerTreeUpdate(); // Trigger reactivity
      }

      this.editingNode.value = null;
    },

    // Update paths for all descendants when parent key changes
    updateDescendantPaths(
      parent: ObjectNodeData,
      oldParentKey: string | undefined,
      newParentKey: string
    ) {
      if (!parent.children) return;

      const traverse = (node: ObjectNodeData) => {
        // Update this node's path tracking
        // The originalKey should reflect the path from the root, not just the immediate parent
        // So we don't change it here - buildRecipe will use the current tree structure

        // Recursively process children
        if (node.children) {
          node.children.forEach((child) => traverse(child));
        }

        // Propagate transforms to update the recipe with new paths
        if (node.transforms && node.transforms.length > 0) {
          this.propagateTransform(node);
        }
      };

      parent.children.forEach((child) => traverse(child));
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

      this.triggerTreeUpdate(); // Trigger reactivity
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
    recipe: computed(() => {
      return buildRecipeUtil((desk as ObjectTransformerDesk).tree.value);
    }),
    buildRecipe() {
      return this.recipe.value;
    },
    applyRecipe(data: any, recipe) {
      return applyRecipeUtil(data, recipe, this.transforms.value);
    },
    exportRecipe() {
      return exportRecipeUtil(this.recipe.value);
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

      // Apply recipe to original data to get transformed data
      const transformedData = applyRecipeUtil(
        this.originalData.value,
        recipe,
        this.transforms.value
      );

      // Update originalData with transformed data (this becomes the new baseline)
      this.originalData.value = transformedData;

      // Rebuild tree from transformed data
      // In model mode, use first array element, otherwise use the full data
      const dataForTree =
        this.mode.value === 'model' && Array.isArray(transformedData)
          ? transformedData[0]
          : transformedData;

      this.tree.value = buildNodeTree(dataForTree, Array.isArray(dataForTree) ? 'Array' : 'Object');
    },

    // Model mode
    extractModelRules() {
      return extractModelRulesUtil(this.tree.value);
    },
    applyModelToAll() {
      // Just switch to object mode to show the full transformed array
      this.setMode('object');
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
