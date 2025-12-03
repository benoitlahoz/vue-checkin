import type { ObjectNodeData, ObjectTransformerDesk } from '..';
import { isStructuralResult } from './type-guards.util';
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

// Compute final transformed value (for objects/arrays with children, first rebuilds from children)
export const computeFinalTransformedValue = (node: ObjectNodeData): any => {
  // If no transforms, return the value
  if (!node.transforms || node.transforms.length === 0) return node.value;

  // Build the base value
  let baseValue = node.value;

  // If node has children, rebuild value from transformed children
  if (node.children && node.children.length > 0) {
    const children = activeChildren(node);

    if (node.type === 'object') {
      baseValue = children.reduce(
        (acc, child) => ({
          ...acc,
          [child.key!]: computeChildTransformedValue(child),
        }),
        {} as Record<string, any>
      );
    } else if (node.type === 'array') {
      baseValue = children.map(computeChildTransformedValue);
    }
  }

  // Apply transforms on the base value (ignoring structural results)
  const transformFns = node.transforms.map((t) => (v: any) => {
    const result = t.fn(v, ...(t.params || []));
    return isStructuralResult(result) ? v : result;
  });

  return pipe(...transformFns)(baseValue);
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

// Create split nodes
const createSplitNodes = (
  parts: any[],
  baseKey: string,
  parent?: ObjectNodeData,
  keys?: string[],
  existingNodes?: ObjectNodeData[],
  sourceNodeId?: string
): ObjectNodeData[] =>
  parts.map((part, i) => {
    const key = keys ? `${baseKey}_${keys[i]}` : `${baseKey}_${i}`;

    // Try to reuse existing node if available
    if (existingNodes && existingNodes[i]) {
      const existing = existingNodes[i];

      // Update the existing node instead of creating a new one
      existing.value = part;
      existing.type = typeof part as any;

      // firstKey never changes - it's the key at first creation
      // If not set yet, set it now (for backward compatibility)
      if (!existing.firstKey) {
        existing.firstKey = existing.key || key;
      }

      // originalKey = what the key WOULD be if not manually renamed
      // Update it to reflect new parent name
      existing.originalKey = key;

      // IMPORTANT: Only update key if NOT manually renamed
      // This preserves "firstname", "lastname" etc.
      if (!existing.keyModified) {
        existing.key = key;
      }

      // Keep the same id, transforms, splitSourceId, splitIndex, etc.
      return existing;
    }

    // Create new node
    const node = buildNodeTree(part, key, parent);

    // IMPORTANT: Set originalKey and firstKey on creation
    node.originalKey = key;
    node.firstKey = key; // The very first key, never changes
    // Track the source node and index for reliable matching
    if (sourceNodeId !== undefined) {
      node.splitSourceId = sourceNodeId;
      node.splitIndex = i;
    }
    return node;
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

  // Check if split nodes already exist by looking for nodes with matching splitSourceId
  const existingSplitNodes =
    node.parent.children?.filter((child) => child.splitSourceId === node.id) || [];

  if (existingSplitNodes.length > 0) {
    // Sort by splitIndex to maintain order
    existingSplitNodes.sort((a, b) => (a.splitIndex || 0) - (b.splitIndex || 0));

    // Reuse existing nodes by passing them to createSplitNodes
    const updatedNodes = createSplitNodes(
      parts,
      baseKey,
      node.parent,
      keys,
      existingSplitNodes,
      node.id
    );

    // Update children array: remove old split nodes and insert updated ones
    const nonSplitChildren = node.parent.children!.filter((child) => {
      // Keep the source node
      if (child === node) return true;
      // Remove nodes that were part of the split (they're in updatedNodes now)
      return child.splitSourceId !== node.id;
    });

    const sourceIndex = nonSplitChildren.indexOf(node);
    node.parent.children = [
      ...nonSplitChildren.slice(0, sourceIndex + 1),
      ...updatedNodes,
      ...nonSplitChildren.slice(sourceIndex + 1),
    ];
  } else {
    // First time creating split nodes
    const newNodes = createSplitNodes(parts, baseKey, node.parent, keys, undefined, node.id);
    node.parent.children = insertNodes(node.parent.children!, newNodes, node, removeSource);
  }

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

      // Check for structural split/arrayToProperties/toObject
      if (
        isStructuralResult(lastResult) &&
        isMultiPartAction(lastResult.action) &&
        (lastResult.parts || lastResult.object) &&
        node.parent
      ) {
        // For toObject, extract keys and values separately
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
    }

    // Propagate based on current type (rebuild value from children)
    propagators[node.type]?.(node);

    // Recursive propagation
    if (node.parent) desk.propagateTransform(node.parent);
  };
