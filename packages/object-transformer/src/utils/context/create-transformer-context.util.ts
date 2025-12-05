import { ref, watch, nextTick, computed } from 'vue';
import type { ObjectNodeData, ObjectNodeType, ObjectTransformerContext } from '../../types';
import { buildNodeTree } from '../node/node-builder.util';
import { getTypeFromValue } from '../type-guards.util';
import {
  formatValue,
  isAddedProperty,
  getKeyClasses,
  generateChildKey,
} from '../node/node-utilities.util';
import { computeIntermediateValue } from '../transform/transform-propagation.util';
import { createKeyEditingMethods } from './key-editing.util';
import { createNodeOperationsMethods } from './node-operations.util';
import { createTransformOperationsMethods } from './transform-operations.util';
import { createSelectionManagementMethods } from './selection-management.util';
import { createRecipeOperationsMethods } from './recipe-operations.util';
import { createModeManagementMethods } from './mode-management.util';
import { findMostCompleteObject, analyzeArrayDifferences } from '../model/model-mode.util';
import { applyRecipe } from '../../recipe/recipe-applier';

export interface CreateContextParams {
  initialData: any;
  initialMode: 'object' | 'model';
  initialTemplateIndex: number;
  originalData: any;
  forbiddenKeys: string[];
  primitiveTypes: ObjectNodeType[];
}

/**
 * Create the complete transformer context by assembling all sub-contexts
 */
export function createTransformerContext(params: CreateContextParams): ObjectTransformerContext {
  const {
    initialData,
    initialMode,
    initialTemplateIndex,
    originalData,
    forbiddenKeys,
    primitiveTypes,
  } = params;

  // Shared refs and state
  const tree = ref<ObjectNodeData>(
    buildNodeTree(initialData, Array.isArray(initialData) ? 'Array' : 'Object')
  );
  const treeKey = ref<number>(0); // Key to force complete remount of tree
  const mode = ref<'object' | 'model'>(initialMode);
  const templateIndex = ref<number>(initialTemplateIndex);
  const originalDataRef = ref(originalData);
  const transforms = ref<any[]>([]);

  // Computed: mode availability
  const isObjectModeAvailable = computed(() => !Array.isArray(originalDataRef.value));
  const isModelModeAvailable = computed(() => Array.isArray(originalDataRef.value));

  // Computed: most complete object index
  const mostCompleteIndex = computed(() => {
    if (!Array.isArray(originalDataRef.value)) return 0;
    return findMostCompleteObject(originalDataRef.value);
  });

  const editingNode = ref<ObjectNodeData | null>(null);
  const tempKey = ref<string | null>(null);
  const forbiddenKeysRef = ref<string[]>(forbiddenKeys);
  const nodeSelections = new WeakMap<ObjectNodeData, string | null>();
  const stepSelections = new WeakMap<ObjectNodeData, Record<number, string | null>>();

  // Structural Transform Handlers Registry
  const structuralTransformHandlers = {};

  // Desk reference (will be injected after desk creation via setDesk)
  let deskRef: any = null;

  // Create methods from sub-contexts
  const nodeOps = createNodeOperationsMethods({
    tree,
    propagateTransform: (node: ObjectNodeData) => transformOps.propagateTransform(node),
    deskRef: () => deskRef,
  });

  const keyEditing = createKeyEditingMethods({
    editingNode,
    tempKey,
    propagateTransform: (node: ObjectNodeData) => transformOps.propagateTransform(node),
    triggerTreeUpdate: () => nodeOps.triggerTreeUpdate(),
    deskRef: () => deskRef,
  });

  const transformOps = createTransformOperationsMethods({
    tree,
    transforms,
    deskRef: () => deskRef,
  });

  const selectionMgmt = createSelectionManagementMethods({
    nodeSelections,
    stepSelections,
  });

  const recipeOps = createRecipeOperationsMethods({
    tree,
    originalData: originalDataRef,
    mode,
    templateIndex,
    transforms,
    treeKey,
    deskRef: () => deskRef,
  });

  const modeOps = createModeManagementMethods({
    tree,
    originalData: originalDataRef,
    mode,
    templateIndex,
    treeKey,
  });

  // Computed: property variations across array items
  // Must be after recipeOps is created so we can use the recorder's recipe
  const propertyVariations = computed(() => {
    if (!Array.isArray(originalDataRef.value)) return [];

    // Force reactivity by accessing tree.value
    // This ensures the computed re-runs when the tree changes
    const currentTree = tree.value;
    if (!currentTree) return analyzeArrayDifferences(originalDataRef.value);

    // Use imported recipe if available, otherwise use recorder's recipe
    const recipe = recipeOps.importedRecipe.value || recipeOps.recorder.recipe.value;

    // If no operations, analyze original data
    if (!recipe.operations || recipe.operations.length === 0) {
      return analyzeArrayDifferences(originalDataRef.value);
    }

    // Apply recipe to original data to get transformed structure
    const transformedData = applyRecipe(originalDataRef.value, recipe, transforms.value);

    return analyzeArrayDifferences(Array.isArray(transformedData) ? transformedData : []);
  });

  // Assemble the complete context
  const context = {
    // Tree
    tree,
    treeKey,
    ...nodeOps,

    // Original data
    originalData: originalDataRef,

    // Mode
    mode,
    isObjectModeAvailable,
    isModelModeAvailable,
    mostCompleteIndex,
    propertyVariations,
    templateIndex,
    ...modeOps,

    // Constants
    primitiveTypes,

    // Structural Transform Handlers Registry
    structuralTransformHandlers,

    // Transforms
    transforms,
    ...transformOps,

    // Nodes
    forbiddenKeys: forbiddenKeysRef,
    getComputedValueType(_node: ObjectNodeData, value: any): ObjectNodeType {
      return getTypeFromValue(value);
    },

    // Key editing
    editingNode,
    tempKey,
    ...keyEditing,
    updateDescendantPaths(
      parent: ObjectNodeData,
      _oldParentKey: string | undefined,
      _newParentKey: string
    ) {
      // This is exposed for API compatibility but the logic is internal to confirmEditKey
      // Could be extracted if needed for external use
      if (!parent.children) return;

      const traverse = (node: ObjectNodeData) => {
        if (node.children) {
          node.children.forEach((child) => traverse(child));
        }
        if (node.transforms && node.transforms.length > 0) {
          transformOps.propagateTransform(node);
        }
      };

      parent.children.forEach((child) => traverse(child));
    },

    // Node utilities (using pure functions)
    isAddedProperty,
    getKeyClasses,
    generateChildKey,
    toggleNodeDeletion: nodeOps.toggleNodeDeletion,

    // Transform selections
    nodeSelections,
    stepSelections,
    ...selectionMgmt,

    // Helpers
    getParamConfig(transformName: string, paramIndex: number) {
      return transforms.value.find((x) => x.name === transformName)?.params?.[paramIndex];
    },
    formatStepValue(node: ObjectNodeData, index: number): string {
      const value = transformOps.computeStepValue(node, index);
      const type = getTypeFromValue(value);
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
    ...recipeOps,

    // Inject desk reference after creation (must be called before using transforms)
    setDesk(desk: any) {
      deskRef = desk;
    },
  };

  return context;
}
