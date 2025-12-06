/**
 * Recipe Operations - Pure Functions
 *
 * Each operation is a pure function that takes data and returns transformed data.
 * All operations use immutable updates via structural sharing.
 */

import type { Operation, TransformOp, RenameOp, DeleteOp, AddOp, UpdateOp, Path } from './types';
import type { Transform } from '../types';
import { updateAt, deleteAt, renameAt, addAt, getAt } from './immutable-update';
import { logger } from '../utils/logger.util';

/**
 * Apply a transform operation
 *
 * Navigates to the target path and applies the transform function
 * Handles structural transforms (split, arrayToProperties, toObject) properly
 */
export const applyTransform = (
  data: any,
  op: TransformOp,
  transforms: Map<string, Transform>
): any => {
  const transform = transforms.get(op.transformName);
  if (!transform) {
    // Transform not found, skip silently
    logger.warn(`Transform "${op.transformName}" not found, skipping operation`);
    return data;
  }

  // Get the current value at path
  const currentValue = getAt(data, op.path);
  if (currentValue === undefined) {
    // Path doesn't exist, skip
    return data;
  }

  try {
    // Apply the transform function
    const result = transform.fn(currentValue, ...op.params);

    // Check if it's a structural transform
    if (result && typeof result === 'object' && result.__structuralChange === true) {
      return applyStructuralTransform(data, op.path, result);
    }

    // Regular transform: update value at path
    return updateAt(data, op.path, () => result);
  } catch (error) {
    logger.error(
      `Error applying transform "${op.transformName}" at path ${op.path.join('.')}:`,
      error
    );
    return data;
  }
};

/**
 * Apply a structural transform result
 *
 * Handles split, arrayToProperties, toObject, and conditionalBranch actions
 */
const applyStructuralTransform = (data: any, path: Path, result: any): any => {
  const action = result.action;

  switch (action) {
    case 'split':
      return applyStructuralSplit(data, path, result);
    case 'arrayToProperties':
      return applyArrayToProperties(data, path, result);
    case 'toObject':
      return applyToObject(data, path, result);
    case 'conditionalBranch':
      return applyConditionalBranch(data, path, result);
    default:
      logger.warn(`Unknown structural transform action: ${action}`);
      return data;
  }
};

/**
 * Apply split structural transform
 * Splits a value into multiple sibling properties
 */
const applyStructuralSplit = (data: any, path: Path, result: any): any => {
  if (!result.parts || !Array.isArray(result.parts)) {
    return data;
  }

  // 🔥 CONDITIONAL EXECUTION: If condition was false, don't apply split
  if (result.conditionMet === false) {
    return data; // Keep data unchanged
  }

  // Navigate to parent
  if (path.length === 0) {
    // Cannot split at root
    return data;
  }

  const parentPath = path.slice(0, -1);
  const lastKey = path[path.length - 1];

  return updateAt(data, parentPath, (parent) => {
    if (!parent || typeof parent !== 'object') {
      return parent;
    }

    // Create new properties for each part
    const newProps: Record<string, any> = {};
    result.parts.forEach((part: any, index: number) => {
      const newKey = `${lastKey}_${index}`;
      newProps[newKey] = part;
    });

    // Remove source if specified
    if (result.removeSource) {
      const { [lastKey]: _, ...rest } = parent;
      return { ...rest, ...newProps };
    }

    // Keep source
    return { ...parent, ...newProps };
  });
};

/**
 * Apply arrayToProperties structural transform
 * Converts array elements to object properties
 */
const applyArrayToProperties = (data: any, path: Path, result: any): any => {
  if (!result.object || typeof result.object !== 'object') {
    return data;
  }

  // Navigate to parent
  if (path.length === 0) {
    // At root level, replace entire data
    return result.object;
  }

  const parentPath = path.slice(0, -1);
  const lastKey = path[path.length - 1];

  return updateAt(data, parentPath, (parent) => {
    if (!parent || typeof parent !== 'object') {
      return parent;
    }

    // Create new properties from result.object
    const newProps: Record<string, any> = {};
    Object.entries(result.object).forEach(([key, value]) => {
      const newKey = `${lastKey}_${key}`;
      newProps[newKey] = value;
    });

    // Remove source if specified
    if (result.removeSource) {
      const { [lastKey]: _, ...rest } = parent;
      return { ...rest, ...newProps };
    }

    // Keep source
    return { ...parent, ...newProps };
  });
};

/**
 * Apply toObject structural transform
 * Creates sibling properties with the pattern lastKey_key
 * (same logic as the common toObject handler in the tree)
 */
const applyToObject = (data: any, path: Path, result: any): any => {
  if (!result.object || typeof result.object !== 'object') {
    return data;
  }

  // Navigate to parent
  if (path.length === 0) {
    // At root level - create properties from result.object
    const newProps: Record<string, any> = {};
    Object.entries(result.object).forEach(([key, value]) => {
      newProps[key] = value;
    });
    return newProps;
  }

  const parentPath = path.slice(0, -1);
  const lastKey = path[path.length - 1];

  return updateAt(data, parentPath, (parent) => {
    if (!parent || typeof parent !== 'object') {
      return parent;
    }

    // Create new properties from result.object (same pattern as tree handler)
    const newProps: Record<string, any> = {};
    Object.entries(result.object).forEach(([key, value]) => {
      const newKey = `${lastKey}_${key}`;
      newProps[newKey] = value;
    });

    // Remove source if specified
    if (result.removeSource) {
      const { [lastKey]: _, ...rest } = parent;
      return { ...rest, ...newProps };
    }

    // Keep source
    return { ...parent, ...newProps };
  });
};

/**
 * Apply conditionalBranch structural transform
 * Creates two sibling properties: key_if and key_else based on condition result
 */
const applyConditionalBranch = (data: any, path: Path, result: any): any => {
  if (result.value === undefined) {
    return data;
  }

  // Navigate to parent
  if (path.length === 0) {
    // Cannot branch at root
    return data;
  }

  const parentPath = path.slice(0, -1);
  const lastKey = path[path.length - 1];

  return updateAt(data, parentPath, (parent) => {
    if (!parent || typeof parent !== 'object') {
      return parent;
    }

    // Create two branches based on condition result
    const newProps: Record<string, any> = {
      [`${lastKey}_if`]: result.value,
      [`${lastKey}_else`]: result.value,
    };

    // Remove source if specified
    if (result.removeSource) {
      const { [lastKey]: _, ...rest } = parent;
      return { ...rest, ...newProps };
    }

    // Keep source
    return { ...parent, ...newProps };
  });
};

/**
 * Apply a rename operation
 *
 * Renames a key at the specified path
 */
export const applyRename = (data: any, op: RenameOp): any => {
  return renameAt(data, op.path, op.from, op.to);
};

/**
 * Apply a delete operation
 *
 * Removes a value at the specified path
 */
export const applyDelete = (data: any, op: DeleteOp): any => {
  return deleteAt(data, op.path);
};

/**
 * Apply an add operation
 *
 * Adds a new property/element at the specified path
 */
export const applyAdd = (data: any, op: AddOp): any => {
  return addAt(data, op.path, op.key, op.value);
};

/**
 * Apply an update operation
 *
 * Updates the value at the specified path
 */
export const applyUpdate = (data: any, op: UpdateOp): any => {
  return updateAt(data, op.path, () => op.value);
};

/**
 * Apply a setTransforms operation
 *
 * Applies multiple transforms sequentially to the value at path
 */
export const applySetTransforms = (
  data: any,
  op: any, // SetTransformsOp
  transforms: Map<string, Transform>
): any => {
  if (!op.transforms || op.transforms.length === 0) {
    return data;
  }

  // Get the current value at path
  const currentValue = getAt(data, op.path);

  if (currentValue === undefined) {
    return data;
  }

  // Apply all transforms sequentially
  let transformedValue = currentValue;
  let chainState: 'pending' | 'matched' | 'unmatched' = 'pending';
  const conditionResults = new Map<number, boolean>(); // Local condition results

  for (let i = 0; i < op.transforms.length; i++) {
    const t = op.transforms[i];
    const transform = transforms.get(t.name);
    if (!transform) {
      if (import.meta.env.DEV) {
        logger.warn(`Transform "${t.name}" not found, skipping`);
      }
      continue;
    }

    // 🔗 CHAIN OF RESPONSIBILITY: Evaluate condition locally without mutating shared transform
    if (transform.condition) {
      if (chainState === 'pending') {
        const conditionResult = transform.condition(transformedValue, ...t.params);
        conditionResults.set(i, conditionResult);
        if (conditionResult) {
          chainState = 'matched';
        }
      } else {
        conditionResults.set(i, false);
      }
    }

    try {
      const result = transform.fn(transformedValue, ...t.params);

      // Check if it's a structural transform
      if (result && typeof result === 'object' && result.__structuralChange === true) {
        // 🔥 Find last condition result in the chain and pass to structural transform
        let lastConditionMet: boolean | undefined;
        for (let j = i; j >= 0; j--) {
          if (conditionResults.has(j)) {
            lastConditionMet = conditionResults.get(j);
            break;
          }
        }

        // Pass condition result to structural transform
        if (lastConditionMet !== undefined) {
          result.conditionMet = lastConditionMet;
        }

        // Apply structural transform
        data = applyStructuralTransform(data, op.path, result);
        // For structural transforms, get the new value at path for next iteration
        transformedValue = getAt(data, op.path);
      } else {
        transformedValue = result;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error(`Error applying transform "${t.name}":`, error);
      }
    }
  }

  // If no structural transforms were applied, update the value at path
  if (transformedValue !== currentValue) {
    return updateAt(data, op.path, () => transformedValue);
  }

  return data;
};

/**
 * 🔥 NEW: Apply conditional transforms operation
 *
 * Chain of Responsibility pattern:
 * - Evaluates conditions in order
 * - Applies transforms from first matching condition
 * - If no predicate, condition is always true
 * - Pure: no mutation of shared state
 */
export const applyConditions = (
  data: any,
  op: any, // ApplyConditionsOp
  transforms: Map<string, Transform>
): any => {
  if (!op.conditions || op.conditions.length === 0) {
    return data;
  }

  const currentValue = getAt(data, op.path);
  if (currentValue === undefined) {
    return data;
  }

  // 🔗 CHAIN OF RESPONSIBILITY: Find first matching condition
  let matchedCondition: any = null;
  let transformedValue = currentValue;

  for (const cond of op.conditions) {
    // No predicate = always true (unconditional)
    if (!cond.predicate) {
      matchedCondition = cond;
      break;
    }

    // Evaluate predicate
    const predicate = transforms.get(cond.predicate.name);
    if (!predicate || !predicate.condition) {
      if (import.meta.env.DEV) {
        logger.warn(`Condition "${cond.predicate.name}" not found or not a condition`);
      }
      continue;
    }

    const conditionResult = predicate.condition(currentValue, ...cond.predicate.params);
    if (conditionResult) {
      matchedCondition = cond;
      break; // Stop at first match
    }
  }

  // No condition matched - return data unchanged
  if (!matchedCondition) {
    return data;
  }

  // Apply transforms from matched condition
  for (const t of matchedCondition.transforms) {
    const transform = transforms.get(t.name);
    if (!transform) {
      if (import.meta.env.DEV) {
        logger.warn(`Transform "${t.name}" not found, skipping`);
      }
      continue;
    }

    try {
      const result = transform.fn(transformedValue, ...t.params);

      // Check if it's a structural transform
      if (result && typeof result === 'object' && result.__structuralChange === true) {
        // Apply structural transform (condition was met, so apply it)
        data = applyStructuralTransform(data, op.path, result);
        transformedValue = getAt(data, op.path);
      } else {
        transformedValue = result;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error(`Error applying transform "${t.name}":`, error);
      }
    }
  }

  // Update value if changed
  if (transformedValue !== currentValue) {
    return updateAt(data, op.path, () => transformedValue);
  }

  return data;
};

/**
 * Apply a single operation to data
 *
 * Dispatcher that routes to the appropriate operation handler
 */
export const applyOperation = (
  data: any,
  operation: Operation,
  transforms: Map<string, Transform>
): any => {
  switch (operation.type) {
    case 'transform':
      return applyTransform(data, operation, transforms);
    case 'setTransforms':
      return applySetTransforms(data, operation, transforms);
    case 'applyConditions': // 🔥 NEW: Unified conditional architecture
      return applyConditions(data, operation, transforms);
    case 'rename':
      return applyRename(data, operation);
    case 'delete':
      return applyDelete(data, operation);
    case 'add':
      return applyAdd(data, operation);
    case 'update':
      return applyUpdate(data, operation);
    default:
      // Unknown operation type, return unchanged
      return data;
  }
};

/**
 * Apply multiple operations sequentially
 *
 * Uses reduce to compose all operations into a single transformation
 */
export const applyOperations = (
  data: any,
  operations: Operation[],
  transforms: Map<string, Transform>
): any => {
  return operations.reduce((acc, op) => {
    return applyOperation(acc, op, transforms);
  }, data);
};
