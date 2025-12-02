import type { ObjectNodeData } from '..';
import { isNull, isArray, isDate, isObject, typeOfToNodeType } from './type-guards.util';

/**
 * Node Factory Functions - Pure builders for different node types
 */

const generateId = (): string => {
  return crypto.randomUUID();
};

export const createNullNode = (key?: string, parent?: ObjectNodeData): ObjectNodeData => ({
  id: generateId(),
  type: 'null',
  key,
  value: null,
  transforms: [],
  parent,
});

export const createDateNode = (
  value: Date,
  key?: string,
  parent?: ObjectNodeData
): ObjectNodeData => ({
  id: generateId(),
  type: 'date',
  key,
  value,
  transforms: [],
  parent,
});

export const createPrimitiveNode = (
  value: any,
  key?: string,
  parent?: ObjectNodeData
): ObjectNodeData => ({
  id: generateId(),
  type: typeOfToNodeType(typeof value),
  key,
  value,
  transforms: [],
  parent,
});

export const createArrayNode = (
  items: any[],
  buildTree: (value: any, key?: string, parent?: ObjectNodeData) => ObjectNodeData,
  key?: string,
  parent?: ObjectNodeData
): ObjectNodeData => {
  const node: ObjectNodeData = {
    id: generateId(),
    type: 'array',
    key,
    value: [],
    transforms: [],
    children: [],
    parent,
  };

  node.children = items.map((item, index) => buildTree(item, String(index), node));
  node.value = node.children.map((c) => c.value);

  return node;
};

export const createObjectNode = (
  obj: Record<string, any>,
  buildTree: (value: any, key?: string, parent?: ObjectNodeData) => ObjectNodeData,
  key?: string,
  parent?: ObjectNodeData
): ObjectNodeData => {
  const node: ObjectNodeData = {
    id: generateId(),
    type: 'object',
    key,
    value: {},
    transforms: [],
    children: [],
    parent,
  };

  node.children = Object.entries(obj).map(([k, v]) => buildTree(v, k, node));
  node.value = node.children.reduce(
    (acc, c) => ({ ...acc, [c.key!]: c.value }),
    {} as Record<string, any>
  );

  return node;
};

/**
 * Build Node Tree - Main recursive builder using pattern matching
 */

export const buildNodeTree = (
  value: any,
  key?: string,
  parent?: ObjectNodeData
): ObjectNodeData => {
  // Pattern matching with early returns
  if (isNull(value)) return createNullNode(key, parent);
  if (isDate(value)) return createDateNode(value, key, parent);
  if (isArray(value)) return createArrayNode(value, buildNodeTree, key, parent);
  if (isObject(value)) return createObjectNode(value, buildNodeTree, key, parent);

  return createPrimitiveNode(value, key, parent);
};
