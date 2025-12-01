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

export interface Transform {
  name: string;
  if: (node: ObjectNode) => boolean;
  fn: (value: any, ...params: any[]) => any;
  params?: any[];
}

export interface ObjectNode {
  type: ObjectNodeType;
  key?: string;
  value: any;
  transforms: Transform[];
  children?: ObjectNode[];
  parent?: ObjectNode;
}

export interface ObjectTransformerContext {
  // Transforms
  transforms: Ref<Transform[]>;
  addTransforms: (...newTransforms: Transform[]) => void;
  propagateTransform: (node: ObjectNode) => void;
  // Nodes
  forbiddenKeys: Ref<string[]>;
  getNodeType: (node: ObjectNode) => ObjectNodeType;
}

export type ObjectTransformerDesk = DeskCore<ObjectNode> & ObjectTransformerContext;

export const ObjectTransformerDeskKey: InjectionKey<ObjectTransformerDesk> =
  Symbol('ObjectTransformerDesk');

export { default as ObjectTransformer } from './ObjectTransformer.vue';
export { default as ObjectTransformerNode } from './ObjectTransformerNode.vue';

// Transforms
export { default as TransformString } from './TransformString.vue';
export { default as TransformNumber } from './TransformNumber.vue';
export { default as TransformDate } from './TransformDate.vue';
export { default as TransformMisc } from './TransformMisc.vue';
