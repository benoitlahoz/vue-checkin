import type { InjectionKey, Ref } from 'vue';

export type NodeType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'property';

export interface NodeObject {
  value: any;
  type: NodeType;
  children?: NodeObject[];
  siblings?: NodeObject[];
}

export const TransformObjectDeskKey: InjectionKey<Ref<NodeObject>> = Symbol('TransformObjectDesk');

export { default as TransformObject } from './TransformObject.vue';
export { default as TransformNode } from './TransformNode.vue';
