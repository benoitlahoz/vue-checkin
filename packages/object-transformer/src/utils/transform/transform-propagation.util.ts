import type { ObjectNodeData, ObjectTransformerDesk, Transform } from '../../types';
import { isStructuralResult } from '../type-guards.util';
import { buildNodeTree } from '../node/node-builder.util';
import { not } from 'vue-airport';
import { isMultiPartAction } from './structural-transform-handlers.util';
import { initKeyMetadata, isKeyModified } from '../node/node-key-metadata.util';
import { logger } from '../logger.util';

/**
 * Transform Application - Pure functions for applying transforms
 */

// Until: apply transformations until predicate is true
const _until =
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
export const computeIntermediateValue = (
  node: ObjectNodeData,
  ignoreConditions = true
): unknown => {
  // For intermediate value, we need to apply transforms but respect conditions unless ignoring
  if (node.transforms.length <= 1) return node.value;

  // Use computeStepValue for the second-to-last transform
  return computeStepValue(node, node.transforms.length - 2, ignoreConditions);
};

// Compute value at specific step (value AFTER applying transforms up to and including index)
export const computeStepValue = (
  node: ObjectNodeData,
  index: number,
  ignoreConditions = true
): unknown => {
  const transformsUpToIndex = node.transforms.slice(0, index + 1);

  // 🔗 CONDITIONAL GROUPS: Evaluate conditions and execute transforms based on group membership
  // ignoreConditions: if true, always execute transforms (for UI preview)
  let value = node.value;
  let activeConditionsMet = true;
  const evaluatedConditions: boolean[] = [];

  for (const t of transformsUpToIndex) {
    if (t.condition) {
      // Evaluate the condition (but may be ignored for preview)
      const conditionResult = t.condition(value, ...(t.params || []));
      t.conditionMet = conditionResult;

      if (!ignoreConditions) {
        // Add to active conditions only if we're not ignoring them
        evaluatedConditions.push(conditionResult);
        activeConditionsMet = evaluatedConditions.every((c) => c);
      }
    } else {
      // Regular transform - execute only if conditions are met (or ignoring conditions)
      const shouldExecute =
        ignoreConditions || evaluatedConditions.length === 0 || activeConditionsMet;

      if (shouldExecute) {
        const result = t.fn(value, ...(t.params || []));

        // Stop if structural change
        if (isStructuralResult(result)) {
          return value;
        }

        value = result;
      }
    }
  }

  return value;
};

// Compute child transformed value (ignores structural transforms)
export const computeChildTransformedValue = (
  child: ObjectNodeData,
  ignoreConditions = true
): unknown => {
  if (child.transforms.length === 0) return child.value;

  // 🔗 CONDITIONAL GROUPS: Process transforms with condition-based execution
  // - A condition starts a "group"
  // - All following non-condition transforms belong to that group
  // - All transforms in a group execute if the condition(s) are met (unless ignoreConditions=true)
  // - A new condition starts a new group (else if behavior)
  // ignoreConditions: if true, always execute transforms (for UI preview)

  let value = child.value;
  let activeConditionsMet = true; // Track if current group's conditions are all met
  const evaluatedConditions: boolean[] = []; // Track condition results for the current group

  for (const t of child.transforms) {
    if (t.condition) {
      // This is a condition - evaluate it (but may be ignored for preview)
      const conditionResult = t.condition(value, ...(t.params || []));
      t.conditionMet = conditionResult;

      if (!ignoreConditions) {
        // Add to active conditions for this group only if not ignoring
        evaluatedConditions.push(conditionResult);

        // Update group state: ALL conditions must be true
        activeConditionsMet = evaluatedConditions.every((c) => c);
      }
    } else {
      // This is a regular transform
      // Only execute if ignoring conditions, or no conditions, or all conditions in the group are met
      const shouldExecute =
        ignoreConditions || evaluatedConditions.length === 0 || activeConditionsMet;

      if (shouldExecute) {
        const result = t.fn(value, ...(t.params || []));

        // Ignore structural results
        if (!isStructuralResult(result)) {
          value = result;
        }
      }

      // After a regular transform, if we had conditions, reset for next group
      // This allows: Condition1 -> Transform1 -> Transform2 -> Condition2 -> Transform3
      // Where Transform1 and Transform2 both depend on Condition1,
      // but Transform3 depends on Condition2
      if (evaluatedConditions.length > 0) {
        // Keep the group active for subsequent transforms until a new condition appears
        // Don't reset here - this was the bug!
      }
    }
  }

  return value;
};

// Compute final transformed value (for objects/arrays with children, first rebuilds from children)
export const computeFinalTransformedValue = (
  node: ObjectNodeData,
  ignoreConditions = true
): unknown => {
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
          [child.key!]: computeChildTransformedValue(child, ignoreConditions),
        }),
        {} as Record<string, any>
      );
    } else if (node.type === 'array') {
      baseValue = children.map((child) => computeChildTransformedValue(child, ignoreConditions));
    }
  }

  // Apply transforms on the base value (respecting conditions and ignoring structural results)
  // 🔗 CONDITIONAL GROUPS: Execute transforms based on condition group membership
  // ignoreConditions: if true, always execute transforms (for UI preview)
  let value = baseValue;
  let activeConditionsMet = true;
  const evaluatedConditions: boolean[] = [];

  for (const t of node.transforms) {
    if (t.condition) {
      // Evaluate the condition (but may be ignored for preview)
      const conditionResult = t.condition(value, ...(t.params || []));
      t.conditionMet = conditionResult;

      if (!ignoreConditions) {
        // Add to active conditions only if not ignoring
        evaluatedConditions.push(conditionResult);
        activeConditionsMet = evaluatedConditions.every((c) => c);
      }
    } else {
      // Regular transform - execute only if ignoring conditions or conditions are met
      const shouldExecute =
        ignoreConditions || evaluatedConditions.length === 0 || activeConditionsMet;

      if (shouldExecute) {
        const result = t.fn(value, ...(t.params || []));

        // Ignore structural results
        if (!isStructuralResult(result)) {
          value = result;
        }
      }
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
  node.value = activeChildren(node).map((child) => computeChildTransformedValue(child));
};

/**
 * Structural Split Handling - Manage split/arrayToProperties transformations
 */

// 🔥 MODEL MODE: Find max parts across all sibling nodes for schema uniformity
const _findMaxPartsInModelMode = (
  node: ObjectNodeData,
  desk: ObjectTransformerDesk
): number | null => {
  // Only in model mode
  if (desk.mode?.value !== 'model') {
    return null;
  }

  // Node must be a property inside an object
  if (!node.parent || node.parent.type !== 'object') {
    return null;
  }

  // Find the container of sibling objects
  // Case 1: Parent's parent is an array (normal case: array[i].property)
  // Case 2: Parent's parent doesn't exist - look at root tree
  let siblingObjects: ObjectNodeData[] = [];

  if (node.parent.parent?.type === 'array') {
    // Array context: get siblings from array children
    siblingObjects =
      node.parent.parent.children?.filter(
        (child: ObjectNodeData) => child.type === 'object' && !child.deleted
      ) || [];
  } else if (desk.tree?.value) {
    // Root context: get siblings from root tree
    const rootNode = desk.tree.value;
    if (rootNode.type === 'array') {
      // Root is an array - get its object children
      siblingObjects =
        rootNode.children?.filter(
          (child: ObjectNodeData) => child.type === 'object' && !child.deleted
        ) || [];
    } else {
      // Root is not an array - can't normalize
      return null;
    }
  } else {
    return null;
  }

  if (siblingObjects.length <= 1) {
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
        existing.key = key;
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
  conditionMet?: boolean,
  transform?: any // ← The transform that created this split
): void => {
  if (!node.parent) return;

  // 🔥 ALWAYS create split nodes in UI for preview
  // The condition will be evaluated when applying the recipe to real data
  // We no longer skip creation based on conditionMet

  const baseKey = node.key || 'part';
  const normalizedParts = parts;

  // Check if split nodes already exist by looking for nodes with matching splitSourceId
  const existingSplitNodes =
    node.parent.children?.filter((child) => child.splitSourceId === node.id) || [];

  if (existingSplitNodes.length > 0) {
    // Sort by splitIndex to maintain order
    existingSplitNodes.sort((a, b) => (a.splitIndex || 0) - (b.splitIndex || 0));

    // Reuse existing nodes by passing them to createSplitNodes
    // Only pass as many existing nodes as we have parts
    const reusableNodes = existingSplitNodes.slice(0, normalizedParts.length);

    const updatedNodes = createSplitNodes(
      normalizedParts,
      baseKey,
      node.parent,
      keys,
      reusableNodes,
      node.id
    );

    // Update children array: remove ALL old split nodes and insert updated ones
    // This handles the case where normalizedParts.length < existingSplitNodes.length
    const nonSplitChildren = node.parent.children!.filter((child) => {
      // Keep the source node
      if (child === node) return true;
      // Remove ALL nodes that were part of the split (not just reused ones)
      return child.splitSourceId !== node.id;
    });

    const sourceIndex = nonSplitChildren.indexOf(node);
    node.parent.children = [
      ...nonSplitChildren.slice(0, sourceIndex + 1),
      ...updatedNodes,
      ...nonSplitChildren.slice(sourceIndex + 1),
    ];

    // 🔥 Record new InsertOps for the updated split
    // Old InsertOps were removed by updateStructuralInsertParams
    if ((desk as any).recorder) {
      // Build conditionStack from ALL preceding condition transforms
      const conditionStack: Array<{ conditionName: string; conditionParams: any[] }> = [];

      for (const t of node.transforms) {
        // Stop when we reach the structural transform itself
        if (t === transform) break;

        // Collect all conditions that precede the structural transform
        if (t.condition) {
          conditionStack.push({
            conditionName: t.name,
            conditionParams: t.params || [],
          });
        }
      }

      updatedNodes.forEach((newNode, idx) => {
        if (newNode.key) {
          const keyInResult = keys ? keys[idx] : idx;

          // Check if the source node's parent has an opId (was created by a previous operation)
          let parentOpId: string | undefined;
          if (node.parent && node.parent.splitSourceId !== undefined) {
            // The source node is inside a structural object - get parent's opId
            parentOpId = (desk as any).recorder.getOpIdForNode(node.parent.id);
          }

          const opId = (desk as any).recorder.recordInsert(newNode.key, undefined, {
            parentOpId,
            sourceKey: node.key,
            createdBy: {
              transformName: transform?.name || (keys ? 'To Object' : 'Split'),
              params: transform?.params || [],
              resultKey: keyInResult,
            },
            conditionStack: conditionStack.length > 0 ? conditionStack : undefined,
            description: `Created by ${keys ? 'toObject' : 'split'} transformation on ${node.key}`,
          });

          // Register the node's opId for future nesting references
          (desk as any).recorder.registerNodeOperation(newNode.id, opId);
        }
      });

      // 🟢 RECORD DELETE for source if removed
      if (removeSource && node.key) {
        (desk as any).recorder.recordDelete(node.key, {
          conditionStack: conditionStack.length > 0 ? conditionStack : undefined,
          description: `Removed by structural transformation`,
        });
      }
    }
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

    // 🟢 RECORD INSERT for each created node
    // IMPORTANT: For model mode, don't record VALUES, record the TRANSFORM
    // 🔥 ALWAYS record InsertOps with conditionStack (if any)
    // The condition will be evaluated for each array element during recipe application

    if ((desk as any).recorder) {
      // Build conditionStack from ALL preceding condition transforms
      const conditionStack: Array<{ conditionName: string; conditionParams: any[] }> = [];

      for (const t of node.transforms) {
        // Stop when we reach the structural transform itself
        if (t === transform) break;

        // Collect all conditions that precede the structural transform
        if (t.condition) {
          conditionStack.push({
            conditionName: t.name,
            conditionParams: t.params || [],
          });
        }
      }

      newNodes.forEach((newNode, idx) => {
        if (newNode.key) {
          // 🔥 KEY INSIGHT: Don't record the template value!
          // Record undefined value - applyInsert will reconstruct by applying the transform
          const keyInResult = keys ? keys[idx] : idx;

          // Check if the source node's parent has an opId (was created by a previous operation)
          let parentOpId: string | undefined;
          if (node.parent && node.parent.splitSourceId !== undefined) {
            // The source node is inside a structural object - get parent's opId
            parentOpId = (desk as any).recorder.getOpIdForNode(node.parent.id);
          }

          const opId = (desk as any).recorder.recordInsert(newNode.key, undefined, {
            parentOpId,
            sourceKey: node.key,
            createdBy: {
              transformName: transform?.name || (keys ? 'To Object' : 'Split'),
              params: transform?.params || [],
              resultKey: keyInResult, // ← Which part of the result to use
            },
            conditionStack: conditionStack.length > 0 ? conditionStack : undefined,
            description: `Created by ${keys ? 'toObject' : 'split'} transformation on ${node.key}`,
          });

          // Register the node's opId for future nesting references
          (desk as any).recorder.registerNodeOperation(newNode.id, opId);
        }
      });

      // 🟢 RECORD DELETE for source if removed
      if (removeSource && node.key) {
        (desk as any).recorder.recordDelete(node.key, {
          conditionStack: conditionStack.length > 0 ? conditionStack : undefined,
          description: `Removed by structural transformation`,
        });
      }
    }
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

      // 🔥 Evaluate ALL conditions in the transform chain to set conditionMet
      // This is needed before checking shouldExecuteStructural
      let currentValue = node.value;
      let allConditionsMet = true;

      for (const t of node.transforms) {
        if (t.condition) {
          // Evaluate the condition
          const conditionResult = t.condition(currentValue, ...(t.params || []));
          t.conditionMet = conditionResult;

          // Track if all conditions in chain are met
          if (!conditionResult) {
            allConditionsMet = false;
          }
        } else if (t.fn) {
          // Apply non-structural transforms to get intermediate value
          const result = t.fn(currentValue, ...(t.params || []));
          if (!isStructuralResult(result)) {
            currentValue = result;
          }
        }
      }

      // 🔥 For UI display: always execute structural transforms (ignoreConditions = true)
      // The conditions will be properly evaluated when applying the recipe to real data
      const isUIPreview = true; // Always show structural transforms in the tree for preview
      const shouldExecuteStructural = isUIPreview || allConditionsMet;

      const intermediateValue = computeIntermediateValue(node);
      const lastResult = lastTransform.fn(intermediateValue, ...(lastTransform.params || []));

      // Check for structural split/arrayToProperties/toObject
      if (
        isStructuralResult(lastResult) &&
        isMultiPartAction(lastResult.action, desk) &&
        (lastResult.parts || lastResult.object) &&
        node.parent &&
        shouldExecuteStructural // 🔥 Only execute if condition chain passed (always true in UI)
      ) {

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
            allConditionsMet, // Pass the evaluated condition result
            lastTransform // ← Pass the transform
          );
        } else if (lastResult.parts) {
          handleStructuralSplit(
            node,
            lastResult.parts,
            lastResult.removeSource,
            desk,
            undefined,
            allConditionsMet, // Pass the evaluated condition result
            lastTransform // ← Pass the transform
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
        // Remove any existing split nodes
        if (node.parent.children) {
          node.parent.children = node.parent.children.filter(
            (child) => child.splitSourceId !== node.id
          );
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
