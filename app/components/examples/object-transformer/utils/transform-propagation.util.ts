import type { ObjectNodeData, ObjectTransformerDesk } from '..';
import { isStructuralResult, getTypeFromValue } from './type-guards.util';
import { buildNodeTree } from './node-builder.util';
import { until, pipe, not } from './functional.util';
import { isMultiPartAction } from './structural-transform-handlers.util';

/**
 * Transform Application - Pure functions for applying transforms
 */

// Compute intermediate value before last transform
export const computeIntermediateValue = (node: ObjectNodeData): any => {
  const transformsExceptLast = node.transforms.slice(0, -1);
  return until(isStructuralResult)(transformsExceptLast, node.value);
};

// Compute value at specific step (value AFTER applying transforms up to and including index)
export const computeStepValue = (node: ObjectNodeData, index: number): any => {
  const transformsUpToIndex = node.transforms.slice(0, index + 1);
  return until(isStructuralResult)(transformsUpToIndex, node.value);
};

// Compute child transformed value (ignores structural transforms)
export const computeChildTransformedValue = (child: ObjectNodeData): any => {
  if (child.transforms.length === 0) return child.value;

  const transformFns = child.transforms.map((t) => (v: any) => {
    const result = t.fn(v, ...(t.params || []));
    return isStructuralResult(result) ? v : result;
  });

  return pipe(...transformFns)(child.value);
};

/**
 * Value Propagation - Pure functions for propagating values
 */

// Get active (non-deleted) children
const isDeleted = (child: ObjectNodeData): boolean => Boolean(child.deleted);
const activeChildren = (node: ObjectNodeData): ObjectNodeData[] =>
  node.children?.filter(not(isDeleted)) || [];

// Propagate object value
export const propagateObjectValue = (node: ObjectNodeData): void => {
  node.value = activeChildren(node).reduce(
    (acc, child) => ({
      ...acc,
      [child.key!]: computeChildTransformedValue(child),
    }),
    {} as Record<string, any>
  );
};

// Propagate array value
export const propagateArrayValue = (node: ObjectNodeData): void => {
  node.value = activeChildren(node).map(computeChildTransformedValue);
};

/**
 * Structural Split Handling - Manage split/arrayToProperties transformations
 */

// Check if split nodes exist
const hasSplitNodes = (parent: ObjectNodeData, baseKeyPrefix: string): boolean =>
  parent.children?.some((child) => child.key?.startsWith(baseKeyPrefix)) || false;

// Filter non-split nodes
const filterNonSplitNodes =
  (baseKeyPrefix: string) => (child: ObjectNodeData, sourceNode: ObjectNodeData) =>
    child === sourceNode || !child.key?.startsWith(baseKeyPrefix);

// Create split nodes
const createSplitNodes = (
  parts: any[],
  baseKey: string,
  parent?: ObjectNodeData,
  keys?: string[]
): ObjectNodeData[] =>
  parts.map((part, i) => {
    const key = keys ? `${baseKey}_${keys[i]}` : `${baseKey}_${i}`;
    return buildNodeTree(part, key, parent);
  });

// Insert nodes immutably
const insertNodes = (
  children: ObjectNodeData[],
  newNodes: ObjectNodeData[],
  sourceNode: ObjectNodeData,
  removeSource: boolean
): ObjectNodeData[] => {
  const index = children.indexOf(sourceNode);
  if (index === -1) return children;

  const before = children.slice(0, index);
  const after = children.slice(index + 1);

  return removeSource
    ? [...before, ...newNodes, ...after]
    : [...before, sourceNode, ...newNodes, ...after];
};

// Replace existing split nodes
const replaceSplitNodes = (
  children: ObjectNodeData[],
  newNodes: ObjectNodeData[],
  sourceNode: ObjectNodeData,
  baseKeyPrefix: string
): ObjectNodeData[] => {
  const filteredChildren = children.filter((child) =>
    filterNonSplitNodes(baseKeyPrefix)(child, sourceNode)
  );
  const newIndex = filteredChildren.indexOf(sourceNode);

  return [
    ...filteredChildren.slice(0, newIndex + 1),
    ...newNodes,
    ...filteredChildren.slice(newIndex + 1),
  ];
};

// Handle structural split
export const handleStructuralSplit = (
  node: ObjectNodeData,
  parts: any[],
  removeSource: boolean,
  desk: ObjectTransformerDesk,
  keys?: string[]
): void => {
  if (!node.parent) return;

  const baseKey = node.key || 'part';
  const baseKeyPrefix = `${baseKey}_`;
  const newNodes = createSplitNodes(parts, baseKey, node.parent, keys);

  node.parent.children = hasSplitNodes(node.parent, baseKeyPrefix)
    ? replaceSplitNodes(node.parent.children!, newNodes, node, baseKeyPrefix)
    : insertNodes(node.parent.children!, newNodes, node, removeSource);

  desk.propagateTransform(node.parent);
};

/**
 * Main Propagation Function - Orchestrates all propagation logic
 */

// Type-based propagators
const propagators: Record<string, (node: ObjectNodeData) => void> = {
  object: propagateObjectValue,
  array: propagateArrayValue,
};

// Create propagate transform function (curried for desk)
export const createPropagateTransform =
  (desk: ObjectTransformerDesk) =>
  (node: ObjectNodeData): void => {
    if (!node) return;

    // Handle structural transforms
    if (node.transforms.length > 0) {
      const lastTransform = node.transforms.at(-1);
      if (!lastTransform) return;

      const intermediateValue = computeIntermediateValue(node);
      const lastResult = lastTransform.fn(intermediateValue, ...(lastTransform.params || []));

      // Check for structural split/arrayToProperties/stringToObject
      if (
        isStructuralResult(lastResult) &&
        isMultiPartAction(lastResult.action) &&
        (lastResult.parts || lastResult.object) &&
        node.parent
      ) {
        // For stringToObject, extract keys and values separately
        if (lastResult.object) {
          const entries = Object.entries(lastResult.object);
          const keys = entries.map(([k]) => k);
          const values = entries.map(([, v]) => v);
          handleStructuralSplit(node, values, lastResult.removeSource, desk, keys);
        } else if (lastResult.parts) {
          handleStructuralSplit(node, lastResult.parts, lastResult.removeSource, desk);
        }
        return;
      }

      // Update node type if transformation changed the value type
      const newType = getTypeFromValue(lastResult);
      if (newType !== node.type) {
        node.type = newType;
      }
    }

    // Propagate based on current type (after potential update)
    propagators[node.type]?.(node);

    // Recursive propagation
    if (node.parent) desk.propagateTransform(node.parent);
  };
