import type { ObjectNode, ObjectTransformerDesk } from '..';
import { isStructuralResult } from './type-guards.util';
import { buildNodeTree } from './node-builder.util';
import { until, pipe, not } from './functional.util';

/**
 * Transform Application - Pure functions for applying transforms
 */

// Compute intermediate value before last transform
export const computeIntermediateValue = (node: ObjectNode): any => {
  const transformsExceptLast = node.transforms.slice(0, -1);
  return until(isStructuralResult)(transformsExceptLast, node.value);
};

// Compute value at specific step (value AFTER applying transforms up to and including index)
export const computeStepValue = (node: ObjectNode, index: number): any => {
  const transformsUpToIndex = node.transforms.slice(0, index + 1);
  return until(isStructuralResult)(transformsUpToIndex, node.value);
};

// Compute child transformed value (ignores structural transforms)
export const computeChildTransformedValue = (child: ObjectNode): any => {
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
const isDeleted = (child: ObjectNode): boolean => Boolean(child.deleted);
const activeChildren = (node: ObjectNode): ObjectNode[] =>
  node.children?.filter(not(isDeleted)) || [];

// Propagate object value
export const propagateObjectValue = (node: ObjectNode): void => {
  node.value = activeChildren(node).reduce(
    (acc, child) => ({
      ...acc,
      [child.key!]: computeChildTransformedValue(child),
    }),
    {} as Record<string, any>
  );
};

// Propagate array value
export const propagateArrayValue = (node: ObjectNode): void => {
  node.value = activeChildren(node).map(computeChildTransformedValue);
};

/**
 * Structural Split Handling - Manage split/arrayToProperties transformations
 */

// Check if split nodes exist
const hasSplitNodes = (parent: ObjectNode, baseKeyPrefix: string): boolean =>
  parent.children?.some((child) => child.key?.startsWith(baseKeyPrefix)) || false;

// Filter non-split nodes
const filterNonSplitNodes =
  (baseKeyPrefix: string) => (child: ObjectNode, sourceNode: ObjectNode) =>
    child === sourceNode || !child.key?.startsWith(baseKeyPrefix);

// Create split nodes
const createSplitNodes = (parts: any[], baseKey: string, parent?: ObjectNode): ObjectNode[] =>
  parts.map((part, i) => buildNodeTree(part, `${baseKey}_${i}`, parent));

// Insert nodes immutably
const insertNodes = (
  children: ObjectNode[],
  newNodes: ObjectNode[],
  sourceNode: ObjectNode,
  removeSource: boolean
): ObjectNode[] => {
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
  children: ObjectNode[],
  newNodes: ObjectNode[],
  sourceNode: ObjectNode,
  baseKeyPrefix: string
): ObjectNode[] => {
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
  node: ObjectNode,
  parts: any[],
  removeSource: boolean,
  desk: ObjectTransformerDesk
): void => {
  if (!node.parent) return;

  const baseKey = node.key || 'part';
  const baseKeyPrefix = `${baseKey}_`;
  const newNodes = createSplitNodes(parts, baseKey, node.parent);

  node.parent.children = hasSplitNodes(node.parent, baseKeyPrefix)
    ? replaceSplitNodes(node.parent.children!, newNodes, node, baseKeyPrefix)
    : insertNodes(node.parent.children!, newNodes, node, removeSource);

  desk.propagateTransform(node.parent);
};

/**
 * Main Propagation Function - Orchestrates all propagation logic
 */

// Type-based propagators
const propagators: Record<string, (node: ObjectNode) => void> = {
  object: propagateObjectValue,
  array: propagateArrayValue,
};

// Create propagate transform function (curried for desk)
export const createPropagateTransform =
  (desk: ObjectTransformerDesk) =>
  (node: ObjectNode): void => {
    if (!node) return;

    // Handle structural transforms
    if (node.transforms.length > 0) {
      const lastTransform = node.transforms.at(-1);
      if (!lastTransform) return;

      const intermediateValue = computeIntermediateValue(node);
      const lastResult = lastTransform.fn(intermediateValue, ...(lastTransform.params || []));

      // Check for structural split/arrayToProperties
      if (
        isStructuralResult(lastResult) &&
        (lastResult.action === 'split' || lastResult.action === 'arrayToProperties') &&
        lastResult.parts &&
        node.parent
      ) {
        handleStructuralSplit(node, lastResult.parts, lastResult.removeSource, desk);
        return;
      }
    }

    // Propagate based on type
    propagators[node.type]?.(node);

    // Recursive propagation
    if (node.parent) desk.propagateTransform(node.parent);
  };
