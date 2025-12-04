// Public types for @vue-airport/object-transformer
import type { ComputedRef, InjectionKey, Ref } from 'vue';

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
  structural?: boolean;
}

export interface TransformRecipe {
  version: string;
  rootType: ObjectNodeType;
  steps: TransformStep[];
  deletedPaths: string[][];
  renamedKeys: Array<{
    path: string[];
    oldKey: string;
    newKey: string;
    isStructuralResult?: boolean;
  }>;
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
  originalKey?: string; // Current expected key (updated when parent is renamed)
  firstKey?: string; // The very first key when node was created (never changes)
  splitSourceId?: string; // ID of the node that created this node via split
  splitIndex?: number; // Index in the split array (0, 1, 2...)
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
  // Structural Transform Handlers Registry
  structuralTransformHandlers: Record<string, (current: any, lastKey: string, result: any) => void>;
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
  // Update descendant paths when renaming parent keys
  updateDescendantPaths: (
    parent: ObjectNodeData,
    oldParentKey: string | undefined,
    newParentKey: string
  ) => void;
  // Desk injection (must be called after desk creation)
  setDesk: (desk: any) => void;
}

export type ObjectTransformerDesk = any & ObjectTransformerContext;

export const ObjectTransformerDeskKey: InjectionKey<ObjectTransformerDesk> =
  Symbol('ObjectTransformerDesk');

export type { ComputedRef, InjectionKey, Ref };
