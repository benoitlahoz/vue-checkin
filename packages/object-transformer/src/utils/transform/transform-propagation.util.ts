import type { ObjectNodeData, ObjectTransformerDesk, Transform } from '../../types';
import { isStructuralResult } from '../type-guards.util';
import { buildNodeTree } from '../node/node-builder.util';
import { pipe, not } from 'vue-airport';
import { isMultiPartAction } from './structural-transform-handlers.util';
import { initKeyMetadata, isKeyModified } from '../node/node-key-metadata.util';
import { logger } from '../logger.util';

/**
 * Transform Application - Pure functions for applying transforms
 */

// Until: apply transformations until predicate is true
const until =
  <T>(predicate: (value: T) => boolean) =>
  (transforms: Transform[], initialValue: T): T => {
    let value = initialValue;
    for (const transform of transforms) {
      const result = transform.fn(value, ...(transform.params || []));
      if (predicate(result)) break;
      value = result;
    }
    return value;
  };

// Compute intermediate value before last transform
export const computeIntermediateValue = (node: ObjectNodeData): unknown => {
  const transformsExceptLast = node.transforms.slice(0, -1);
  return until(isStructuralResult)(transformsExceptLast, node.value);
};

// Compute value at specific step (value AFTER applying transforms up to and including index)
export const computeStepValue = (node: ObjectNodeData, index: number): unknown => {
  const transformsUpToIndex = node.transforms.slice(0, index + 1);

  // 🔗 CHAIN OF RESPONSIBILITY: Evaluate conditions sequentially
  // Stop at first true condition (if/else if behavior)
  let value = node.value;
  let chainState: 'pending' | 'matched' | 'unmatched' = 'pending';
  let lastConditionMet: boolean | undefined;

  for (const t of transformsUpToIndex) {
    // If transform has a condition
    if (t.condition) {
      // Only evaluate if chain is still pending (no condition matched yet)
      if (chainState === 'pending') {
        const conditionResult = t.condition(value, ...(t.params || []));
        t.conditionMet = conditionResult;

        if (conditionResult) {
          chainState = 'matched'; // First true condition → stop chain
          lastConditionMet = true;
        }
      } else {
        // Chain already resolved, skip evaluation
        t.conditionMet = false;
      }
    }

    // Apply transform (structural transforms will check conditionMet internally)
    const result = t.fn(value, ...(t.params || []));

    // Stop if structural change
    if (isStructuralResult(result)) {
      return value;
    }

    value = result;
  }

  // If we went through all conditions without a match, mark as unmatched
  if (chainState === 'pending') {
    lastConditionMet = false;
  }

  return value;
};

// Compute child transformed value (ignores structural transforms)
export const computeChildTransformedValue = (child: ObjectNodeData): unknown => {
  if (child.transforms.length === 0) return child.value;

  logger.debug(
    `[computeChildTransformedValue] Processing ${child.key}="${child.value}", transforms count=${child.transforms.length}`
  );

  // 🔗 CHAIN OF RESPONSIBILITY: Sequential condition evaluation
  let value = child.value;
  let chainState: 'pending' | 'matched' | 'unmatched' = 'pending';

  for (const t of child.transforms) {
    // If transform has a condition
    if (t.condition) {
      // Only evaluate if chain is still pending
      if (chainState === 'pending') {
        const conditionResult = t.condition(value, ...(t.params || []));
        t.conditionMet = conditionResult; // 🔥 OK because each node has its own transform instances

        if (conditionResult) {
          chainState = 'matched'; // Stop chain at first true
        }
      } else {
        t.conditionMet = false; // Skip subsequent conditions
      }
    }

    const result = t.fn(value, ...(t.params || []));

    // Ignore structural results
    if (!isStructuralResult(result)) {
      value = result;
    }
  }

  return value;
};

// Compute final transformed value (for objects/arrays with children, first rebuilds from children)
export const computeFinalTransformedValue = (node: ObjectNodeData): unknown => {
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

  // Apply transforms on the base value (respecting conditions and ignoring structural results)
  // 🔗 CHAIN OF RESPONSIBILITY: Sequential condition evaluation
  let value = baseValue;
  let chainState: 'pending' | 'matched' | 'unmatched' = 'pending';

  for (const t of node.transforms) {
    // If transform has a condition
    if (t.condition) {
      // Only evaluate if chain is still pending
      if (chainState === 'pending') {
        const conditionResult = t.condition(value, ...(t.params || []));
        t.conditionMet = conditionResult;

        if (conditionResult) {
          chainState = 'matched'; // Stop chain at first true
        }
      } else {
        t.conditionMet = false; // Skip subsequent conditions
      }
    }

    const result = t.fn(value, ...(t.params || []));

    // Ignore structural results
    if (!isStructuralResult(result)) {
      value = result;
    }
  }

  return value;
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
  // Rebuild the object with current keys from active children
  // This ensures key changes are reflected in the value
  node.value = activeChildren(node).reduce(
    (acc, child) => {
      acc[child.key!] = computeChildTransformedValue(child);
      return acc;
    },
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

// 🔥 MODEL MODE: Find max parts across all sibling nodes for schema uniformity
const findMaxPartsInModelMode = (
  node: ObjectNodeData,
  desk: ObjectTransformerDesk
): number | null => {
  // Only in model mode
  if (desk.mode?.value !== 'model') {
    logger.debug(`[findMaxParts] Mode is NOT model: ${desk.mode?.value}`);
    return null;
  }

  logger.debug(`[findMaxParts] Mode IS model`, {
    nodeKey: node.key,
    nodeType: node.type,
    hasParent: !!node.parent,
    parentType: node.parent?.type,
    hasGrandparent: !!node.parent?.parent,
    grandparentType: node.parent?.parent?.type,
  });

  // Node must be a property inside an object
  if (!node.parent || node.parent.type !== 'object') {
    logger.debug(`[findMaxParts] Parent is not an object`);
    return null;
  }

  // Find the container of sibling objects
  // Case 1: Parent's parent is an array (normal case: array[i].property)
  // Case 2: Parent's parent doesn't exist - look at root tree
  let siblingObjects: ObjectNodeData[] = [];

  if (node.parent.parent?.type === 'array') {
    // Array context: get siblings from array children
    siblingObjects =
      node.parent.parent.children?.filter((child) => child.type === 'object' && !child.deleted) ||
      [];
  } else if (desk.tree?.value) {
    // Root context: get siblings from root tree
    const rootNode = desk.tree.value;
    if (rootNode.type === 'array') {
      // Root is an array - get its object children
      siblingObjects =
        rootNode.children?.filter((child) => child.type === 'object' && !child.deleted) || [];
      logger.debug(`[findMaxParts] Root array case - found ${siblingObjects.length} siblings`);
    } else {
      // Root is not an array - can't normalize
      logger.debug(`[findMaxParts] Root is not array: ${rootNode.type}`);
      return null;
    }
  } else {
    logger.debug(`[findMaxParts] No tree available`);
    return null;
  }

  if (siblingObjects.length <= 1) {
    logger.debug(`[findMaxParts] Not enough siblings: ${siblingObjects.length}`);
    return null;
  }

  // For each sibling, find the corresponding property node and check its split
  let maxParts = 0;
  const targetKey = node.key;

  for (const sibling of siblingObjects) {
    // Find the property with the same key in this sibling
    const propertyNode = sibling.children?.find(
      (child) => child.key === targetKey && !child.deleted
    );

    if (!propertyNode) continue;

    // Check if this node has a Split transform
    const hasSplit = propertyNode.transforms.some((t) => t.structural && t.name === 'Split');

    if (!hasSplit) continue;

    // Count existing split nodes
    const splitNodes =
      sibling.children?.filter((child) => child.splitSourceId === propertyNode.id) || [];

    maxParts = Math.max(maxParts, splitNodes.length);

    // Also check what the split WOULD produce
    if (propertyNode.transforms.length > 0) {
      const lastTransform = propertyNode.transforms.at(-1);
      if (lastTransform?.structural && lastTransform.name === 'Split') {
        const intermediateValue = computeIntermediateValue(propertyNode);
        const result = lastTransform.fn(intermediateValue, ...(lastTransform.params || []));
        if (isStructuralResult(result) && result.parts) {
          maxParts = Math.max(maxParts, result.parts.length);
        }
      }
    }
  }

  return maxParts > 0 ? maxParts : null;
};

// Create split nodes
const createSplitNodes = (
  parts: unknown[],
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

      // 🟡 OPTIMIZATION: Use new metadata structure
      // firstKey never changes - it's the key at first creation
      // If not set yet, set it now (for backward compatibility)
      if (!existing.keyMetadata?.original) {
        initKeyMetadata(existing, existing.key || key);
      }

      // originalKey = what the key WOULD be if not manually renamed
      // Update it to reflect new parent name
      if (!existing.keyMetadata) {
        existing.keyMetadata = {};
      }
      existing.keyMetadata.original = key;

      // IMPORTANT: Only update key if NOT manually renamed
      // This preserves "firstname", "lastname" etc.
      if (!isKeyModified(existing)) {
        existing.key = newKey;
      }

      // Keep the same id, transforms, splitSourceId, splitIndex, etc.
      return existing;
    }

    // Create new node
    const node = buildNodeTree(part, key, parent);

    // 🟡 OPTIMIZATION: Use new metadata structure
    initKeyMetadata(node, key);
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
  parts: unknown[],
  removeSource: boolean,
  desk: ObjectTransformerDesk,
  keys?: string[],
  conditionMet?: boolean
): void => {
  if (!node.parent) return;

  // 🔥 USER CHOICE: If condition was false, do NOT create split nodes
  // Keep the original property as-is (user's choice to have non-conformant objects)
  if (conditionMet === false) {
    logger.debug(`[Split] Condition false - skipping split for ${node.key}`);
    // Remove any existing split nodes from previous evaluations
    if (node.parent.children) {
      node.parent.children = node.parent.children.filter(
        (child) => child.splitSourceId !== node.id
      );
    }
    return;
  }

  const baseKey = node.key || 'part';
  let normalizedParts = parts;

  // Check if split nodes already exist by looking for nodes with matching splitSourceId
  const existingSplitNodes =
    node.parent.children?.filter((child) => child.splitSourceId === node.id) || [];

  if (existingSplitNodes.length > 0) {
    // Sort by splitIndex to maintain order
    existingSplitNodes.sort((a, b) => (a.splitIndex || 0) - (b.splitIndex || 0));

    // Reuse existing nodes by passing them to createSplitNodes
    const updatedNodes = createSplitNodes(
      normalizedParts,
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
    const newNodes = createSplitNodes(
      normalizedParts,
      baseKey,
      node.parent,
      keys,
      undefined,
      node.id
    );
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
  (desk?: ObjectTransformerDesk) =>
  (node: ObjectNodeData): void => {
    if (!node) return;

    // desk should now always be provided via getDeskFn from context
    if (!desk) {
      if (import.meta.env.DEV) {
        logger.warn('[ObjectTransformer] createPropagateTransform called without desk reference');
      }
      return;
    }

    // Handle structural transforms
    if (node.transforms.length > 0) {
      const lastTransform = node.transforms.at(-1);
      if (!lastTransform) return;

      // 🔥 CHAIN OF RESPONSIBILITY: Check if any preceding condition failed
      // If there's a condition in the chain and it's false, don't execute structural
      let shouldExecuteStructural = true;
      let lastConditionMet: boolean | undefined;

      for (let i = node.transforms.length - 1; i >= 0; i--) {
        const t = node.transforms[i];
        if (t.conditionMet !== undefined) {
          lastConditionMet = t.conditionMet;
          // If any condition in the chain is false, don't execute structural
          if (!t.conditionMet) {
            shouldExecuteStructural = false;
          }
          break; // Only check the last condition (Chain of Responsibility)
        }
      }

      logger.debug(
        `[createPropagateTransform] node.key=${node.key}, shouldExecuteStructural=${shouldExecuteStructural}, lastConditionMet=${lastConditionMet}`
      );

      const intermediateValue = computeIntermediateValue(node);
      const lastResult = lastTransform.fn(intermediateValue, ...(lastTransform.params || []));

      // Check for structural split/arrayToProperties/toObject
      if (
        isStructuralResult(lastResult) &&
        isMultiPartAction(lastResult.action, desk) &&
        (lastResult.parts || lastResult.object) &&
        node.parent &&
        shouldExecuteStructural // 🔥 Only execute if condition chain passed
      ) {
        logger.debug(
          `[handleStructuralSplit] Executing split for node.key=${node.key}, node.value=${node.value}`
        );

        // For toObject, extract keys and values separately
        if (lastResult.object) {
          const entries = Object.entries(lastResult.object);
          const keys = entries.map(([k]) => k);
          const values = entries.map(([, v]) => v);
          handleStructuralSplit(
            node,
            values,
            lastResult.removeSource,
            desk,
            keys,
            lastConditionMet
          );
        } else if (lastResult.parts) {
          handleStructuralSplit(
            node,
            lastResult.parts,
            lastResult.removeSource,
            desk,
            undefined,
            lastConditionMet
          );
        }
        return;
      }

      // 🔥 If structural result exists but shouldn't be executed (condition failed),
      // clean up any existing split nodes
      if (
        isStructuralResult(lastResult) &&
        isMultiPartAction(lastResult.action, desk) &&
        !shouldExecuteStructural &&
        node.parent
      ) {
        if (import.meta.env.DEV) {
          logger.debug(
            `[createPropagateTransform] Cleaning up splits for node.key=${node.key} (condition failed)`
          );
        }
        // Remove any existing split nodes
        if (node.parent.children) {
          const childrenBefore = node.parent.children.length;
          node.parent.children = node.parent.children.filter(
            (child) => child.splitSourceId !== node.id
          );
          const childrenAfter = node.parent.children.length;
          if (import.meta.env.DEV && childrenBefore !== childrenAfter) {
            logger.debug(
              `[createPropagateTransform] Removed ${childrenBefore - childrenAfter} split nodes`
            );
          }
        }
      }
    }

    // Propagate based on current type (rebuild value from children)
    // Only propagate if node has children (containers)
    if (node.children && node.children.length > 0) {
      propagators[node.type]?.(node);
    }

    // 🔄 Update node type if transforms changed it
    // For primitives with transforms, check if the final transformed value has a different type
    if (node.transforms.length > 0 && !node.children?.length) {
      const finalValue = computeFinalTransformedValue(node);
      const finalType = typeof finalValue;

      // DON'T update node.value - it should stay as the original value
      // Only update the type so the correct transforms are available

      // Map JavaScript types to ObjectNodeType
      let newType: string = finalType;
      if (finalType === 'object') {
        if (finalValue === null) {
          newType = 'null';
        } else if (finalValue instanceof Date) {
          newType = 'date';
        } else if (Array.isArray(finalValue)) {
          newType = 'array';
        } else {
          newType = 'object';
        }
      }

      // Update type if it changed
      if (newType !== node.type) {
        node.type = newType as any;
      }
    }

    // Recursive propagation
    if (node.parent) desk.propagateTransform(node.parent);
  };
