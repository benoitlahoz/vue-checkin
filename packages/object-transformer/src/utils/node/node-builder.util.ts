import type { ObjectNodeData } from '../../types';
import { isNull, isArray, isDate, isObject, typeOfToNodeType } from '../type-guards.util';
import { initKeyMetadata } from './node-key-metadata.util';

/**
 * Node Factory Functions - Pure builders for different node types
 */

const generateId = (): string => {
  return crypto.randomUUID();
};

export const createNullNode = (key?: string, parent?: ObjectNodeData): ObjectNodeData => {
  const node: ObjectNodeData = {
    id: generateId(),
    type: 'null',
    key,
    value: null,
    transforms: [],
    parent,
  };
  if (key) initKeyMetadata(node, key);
  return node;
};

export const createDateNode = (
  value: Date,
  key?: string,
  parent?: ObjectNodeData
): ObjectNodeData => {
  const node: ObjectNodeData = {
    id: generateId(),
    type: 'date',
    key,
    value,
    transforms: [],
    parent,
  };
  if (key) initKeyMetadata(node, key);
  return node;
};

export const createPrimitiveNode = (
  value: any,
  key?: string,
  parent?: ObjectNodeData
): ObjectNodeData => {
  const node: ObjectNodeData = {
    id: generateId(),
    type: typeOfToNodeType(typeof value),
    key,
    value,
    transforms: [],
    parent,
  };
  if (key) initKeyMetadata(node, key);
  return node;
};

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
  if (key) initKeyMetadata(node, key);

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
  if (key) initKeyMetadata(node, key);

  node.children = Object.entries(obj).map(([k, v]) => buildTree(v, k, node));
  node.value = node.children.reduce(
    (acc, c) => ({ ...acc, [c.key!]: c.value }),
    {} as Record<string, any>
  );

  return node;
};

/**
 * Destroy tree by breaking all circular references
 * This ensures proper garbage collection and prevents memory leaks
 */
export const destroyNodeTree = (node: ObjectNodeData): void => {
  if (!node) return;

  // Recursively destroy children first
  if (node.children) {
    node.children.forEach(destroyNodeTree);
    node.children = undefined;
  }

  // Break parent reference
  node.parent = undefined;

  // Clear transforms to break any function references
  if (node.transforms) {
    node.transforms = [];
  }
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
