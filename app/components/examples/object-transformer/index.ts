import type { DeskCore } from '#vue-airport';
import type { InjectionKey, Ref } from 'vue';

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
  action: 'split' | 'merge' | 'arrayToProperties';
  parts?: any[];
  removeSource?: boolean;
}

export interface Transform {
  name: string;
  if: (node: ObjectNode) => boolean;
  fn: (value: any, ...params: any[]) => any | StructuralTransformResult;
  params?: any[];
}

export interface ObjectNode {
  id: string; // Unique identifier for the node
  type: ObjectNodeType;
  key?: string;
  value: any;
  transforms: Transform[];
  children?: ObjectNode[];
  parent?: ObjectNode;
  keyModified?: boolean; // True si la clé a été modifiée par l'utilisateur
  deleted?: boolean; // True si la propriété est marquée comme supprimée
  isOpen?: boolean; // État d'ouverture des enfants (pour object/array)
}

export interface ObjectTransformerContext {
  // Tree
  tree: Ref<ObjectNode>;
  getNode: (id: string) => ObjectNode | null;
  // Constants
  primitiveTypes: ObjectNodeType[];
  // Transforms
  transforms: Ref<Transform[]>;
  addTransforms: (...newTransforms: Transform[]) => void;
  findTransform: (name: string, node?: ObjectNode) => Transform | undefined;
  initParams: (transform: Transform) => any[];
  createTransformEntry: (name: string, node?: ObjectNode) => (Transform & { params: any[] }) | null;
  propagateTransform: (node: ObjectNode) => void;
  computeStepValue: (node: ObjectNode, index: number) => any;
  // Nodes
  forbiddenKeys: Ref<string[]>;
  getComputedValueType: (node: ObjectNode, value: any) => ObjectNodeType;
  // Key editing
  editingNode: Ref<ObjectNode | null>;
  tempKey: Ref<string | null>;
  startEditKey: (node: ObjectNode) => void;
  confirmEditKey: (node: ObjectNode) => void;
  cancelEditKey: (node: ObjectNode) => void;
  // Node utilities (pure functions)
  isAddedProperty: (node: ObjectNode) => boolean;
  getKeyClasses: (node: ObjectNode) => string;
  generateChildKey: (child: ObjectNode, index: number) => string;
  toggleNodeDeletion: (node: ObjectNode) => void;
  // Transform selections
  nodeSelections: WeakMap<ObjectNode, string | null>;
  stepSelections: WeakMap<ObjectNode, Record<number, string | null>>;
  getNodeSelection: (node: ObjectNode) => string | null;
  setNodeSelection: (node: ObjectNode, value: string | null) => void;
  getStepSelection: (node: ObjectNode) => Record<number, string | null>;
  setStepSelection: (node: ObjectNode, value: Record<number, string | null>) => void;
  // Helpers
  getParamConfig: (transformName: string, paramIndex: number) => any;
  formatStepValue: (node: ObjectNode, index: number) => string;
  isStructuralTransform: (node: ObjectNode, transformIndex: number) => boolean;
}

export type ObjectTransformerDesk = DeskCore<ObjectNode> & ObjectTransformerContext;

export const ObjectTransformerDeskKey: InjectionKey<ObjectTransformerDesk> =
  Symbol('ObjectTransformerDesk');

export { default as ObjectTransformer } from './ObjectTransformer.vue';
export { default as ObjectTransformerPreview } from './ObjectTransformerPreview.vue';
export { default as TransformerNode } from './TransformerNode.vue';
export { default as TransformerSelect } from './TransformerSelect.vue';
export { default as TransformerParam } from './TransformerParam.vue';
export { default as NodeKeyEditor } from './NodeKeyEditor.vue';
export { default as NodeActions } from './NodeActions.vue';
export { default as NodeTransformsList } from './NodeTransformsList.vue';

// Transforms
export { default as TransformString } from './transforms/TransformString.vue';
export { default as TransformNumber } from './transforms/TransformNumber.vue';
export { default as TransformDate } from './transforms/TransformDate.vue';
export { default as TransformBoolean } from './transforms/TransformBoolean.vue';
export { default as TransformObject } from './transforms/TransformObject.vue';
export { default as TransformArray } from './transforms/TransformArray.vue';

// Utils
export * from './utils/node-editing.util';
export * from './utils/node-transforms.util';

export type { ObjectTransformerProps } from './ObjectTransformer.vue';
