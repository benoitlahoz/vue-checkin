import type { DeskCore } from '#vue-airport';
import type { ComputedRef, InjectionKey, Ref } from 'vue';

/**
 * Current recipe format version
 */
export const CURRENT_RECIPE_VERSION = '1.0.0';

export type TransformerMode = 'object' | 'model';

export type ObjectNodeType =
  | 'string'
  | 'number'
  | 'bigint'
  | 'symbol'
  | 'boolean'
  | 'object'
  | 'array'
  | 'undefined'
  | 'function'
  | 'null'
  | 'unknown'
  | 'date';

export interface StructuralTransformResult {
  __structuralChange: true;
  action: 'split' | 'merge' | 'arrayToProperties' | 'toObject';
  parts?: any[];
  object?: any;
  removeSource?: boolean;
}

export interface Transform {
  name: string;
  if: (node: ObjectNodeData) => boolean;
  fn: (value: any, ...params: any[]) => any | StructuralTransformResult;
  params?: any[];
  structural?: boolean; // Mark if this transform is structural (returns StructuralTransformResult)
}

export interface TransformRecipe {
  version: string;
  rootType: ObjectNodeType;
  steps: TransformStep[];
  deletedPaths: string[][];
  renamedKeys: Array<{ path: string[]; oldKey: string; newKey: string }>;
  requiredTransforms: string[]; // List of transform names required for this recipe
  createdAt?: string; // ISO timestamp of recipe creation
}

export interface TransformStep {
  path: string[];
  originalType: ObjectNodeType;
  transformName: string;
  params: any[];
  structural?: boolean;
}

export interface ObjectNodeData {
  id: string; // Unique identifier for the node
  type: ObjectNodeType;
  key?: string;
  originalKey?: string; // Original key before rename (for recipe tracking)
  value: any;
  transforms: Transform[];
  children?: ObjectNodeData[];
  parent?: ObjectNodeData;
  keyModified?: boolean; // True si la clé a été modifiée par l'utilisateur
  deleted?: boolean; // True si la propriété est marquée comme supprimée
  isOpen?: boolean; // État d'ouverture des enfants (pour object/array)
}

export interface ObjectTransformerContext {
  // Tree
  tree: Ref<ObjectNodeData>;
  triggerTreeUpdate: () => void;
  originalData: Ref<any>;
  getNode: (id: string) => ObjectNodeData | null;
  // Mode
  mode: Ref<TransformerMode>;
  setMode: (mode: TransformerMode) => void;
  templateIndex: Ref<number>;
  setTemplateIndex: (index: number) => void;
  // Constants
  primitiveTypes: ObjectNodeType[];
  // Transforms
  transforms: Ref<Transform[]>;
  addTransforms: (...newTransforms: Transform[]) => void;
  findTransform: (name: string, node?: ObjectNodeData) => Transform | undefined;
  initParams: (transform: Transform) => any[];
  createTransformEntry: (
    name: string,
    node?: ObjectNodeData
  ) => (Transform & { params: any[] }) | null;
  propagateTransform: (node: ObjectNodeData) => void;
  computeStepValue: (node: ObjectNodeData, index: number) => any;
  // Nodes
  forbiddenKeys: Ref<string[]>;
  getComputedValueType: (node: ObjectNodeData, value: any) => ObjectNodeType;
  // Key editing
  editingNode: Ref<ObjectNodeData | null>;
  tempKey: Ref<string | null>;
  startEditKey: (node: ObjectNodeData) => void;
  confirmEditKey: (node: ObjectNodeData) => void;
  cancelEditKey: (node: ObjectNodeData) => void;
  // Node utilities (pure functions)
  isAddedProperty: (node: ObjectNodeData) => boolean;
  getKeyClasses: (node: ObjectNodeData) => string;
  generateChildKey: (child: ObjectNodeData, index: number) => string;
  toggleNodeDeletion: (node: ObjectNodeData) => void;
  // Transform selections
  nodeSelections: WeakMap<ObjectNodeData, string | null>;
  stepSelections: WeakMap<ObjectNodeData, Record<number, string | null>>;
  getNodeSelection: (node: ObjectNodeData) => string | null;
  setNodeSelection: (node: ObjectNodeData, value: string | null) => void;
  getStepSelection: (node: ObjectNodeData) => Record<number, string | null>;
  setStepSelection: (node: ObjectNodeData, value: Record<number, string | null>) => void;
  // Helpers
  getParamConfig: (transformName: string, paramIndex: number) => any;
  formatStepValue: (node: ObjectNodeData, index: number) => string;
  isStructuralTransform: (node: ObjectNodeData, transformIndex: number) => boolean;
  // Recipe management
  recipe: ComputedRef<TransformRecipe>;
  buildRecipe: () => TransformRecipe;
  applyRecipe: (data: any, recipe: TransformRecipe) => any;
  exportRecipe: () => string;
  importRecipe: (recipeJson: string) => void;
  // Model mode
  extractModelRules: () => any[];
  applyModelToAll: () => void;
}

export type ObjectTransformerDesk = DeskCore<ObjectNodeData> & ObjectTransformerContext;

export const ObjectTransformerDeskKey: InjectionKey<ObjectTransformerDesk> =
  Symbol('ObjectTransformerDesk');

export { default as ObjectTransformer } from './ObjectTransformer.vue';
export { default as ObjectPreview } from './ObjectPreview.vue';
export { default as RecipePreview } from './RecipePreview.vue';
export { default as ObjectNode } from './ObjectNode.vue';
export { default as ModeToggle } from './ModeToggle.vue';
export { default as TransformSelect } from './TransformSelect.vue';
export { default as TransformParam } from './TransformParam.vue';
export { default as NodeKeyEditor } from './NodeKeyEditor.vue';
export { default as NodeActions } from './NodeActions.vue';
export { default as NodeOpen } from './NodeOpen.vue';
export { default as NodeTransformsList } from './NodeTransformsList.vue';

// Transforms
export { default as TransformString } from './transforms/TransformString.vue';
export { default as TransformNumber } from './transforms/TransformNumber.vue';
export { default as TransformDate } from './transforms/TransformDate.vue';
export { default as TransformBoolean } from './transforms/TransformBoolean.vue';
export { default as TransformObject } from './transforms/TransformObject.vue';
export { default as TransformArray } from './transforms/TransformArray.vue';

// Utils
export * from './utils';

export type { ObjectTransformerProps } from './ObjectTransformer.vue';
