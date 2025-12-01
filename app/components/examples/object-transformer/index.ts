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
  // Constants
  primitiveTypes: ObjectNodeType[];
  // Transforms
  transforms: Ref<Transform[]>;
  addTransforms: (...newTransforms: Transform[]) => void;
  findTransform: (name: string) => Transform | undefined;
  initParams: (transform: Transform) => any[];
  createTransformEntry: (name: string) => (Transform & { params: any[] }) | null;
  propagateTransform: (node: ObjectNode) => void;
  computeStepValue: (node: ObjectNode, index: number) => any;
  // Nodes
  forbiddenKeys: Ref<string[]>;
  sanitizeKey: (key: string) => string | null;
  autoRenameKey: (parent: ObjectNode, base: string) => string;
  getNodeType: (node: ObjectNode) => ObjectNodeType;
  getComputedValueType: (node: ObjectNode, value: any) => ObjectNodeType;
  formatValue: (value: any, type: ObjectNodeType) => string;
  // Key editing
  editingNode: Ref<ObjectNode | null>;
  tempKey: Ref<string | null>;
  startEditKey: (node: ObjectNode) => void;
  confirmEditKey: (node: ObjectNode) => void;
  cancelEditKey: (node: ObjectNode) => void;
  // Node utilities
  isAddedProperty: (node: ObjectNode) => boolean;
  getKeyClasses: (node: ObjectNode) => string;
  generateChildKey: (child: ObjectNode, index: number) => string;
  toggleNodeDeletion: (node: ObjectNode) => void;
  // Transform selections
  nodeSelections: Map<ObjectNode, string | null>;
  stepSelections: Map<ObjectNode, Record<number, string | null>>;
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
export { default as TransformerNode } from './TransformerNode.vue';
export { default as TransformerParamInput } from './TransformerParamInput.vue';

// Transforms
export { default as TransformString } from './TransformString.vue';
export { default as TransformNumber } from './TransformNumber.vue';
export { default as TransformDate } from './TransformDate.vue';
export { default as TransformBoolean } from './TransformBoolean.vue';
export { default as TransformMisc } from './TransformMisc.vue';

export type { ObjectTransformerProps } from './ObjectTransformer.vue';
