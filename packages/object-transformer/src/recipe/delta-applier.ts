/**
 * Delta Applier - Apply delta operations to data
 *
 * Applies a sequence of delta operations to transform an object.
 * Each operation is applied sequentially, modifying the object in-place.
 */

import type {
  Recipe,
  DeltaOp,
  InsertOp,
  DeleteOp,
  TransformOp,
  RenameOp,
  RetainOp,
} from './types-v4';
import type { Transform } from '../types';
import { logger } from '../utils/logger.util';

/**
 * Apply a recipe to data
 *
 * For array data with object recipe (template mode), applies recipe to each element.
 *
 * @param data - Input data to transform
 * @param recipe - Recipe containing delta operations
 * @param transforms - Available transform functions
 * @param sourceData - Original source data (for value lookup in transforms)
 * @returns Transformed data
 */
export const applyRecipe = (
  data: any,
  recipe: Recipe,
  transforms: Transform[],
  sourceData?: any
): any => {
  const transformsMap = new Map(transforms.map((t) => [t.name, t]));

  // Handle template mode: array data with object recipe
  // OR array recipe (built on template) applied to array data
  if (
    Array.isArray(data) &&
    (recipe.metadata?.rootType === 'object' || recipe.metadata?.rootType === 'array')
  ) {
    return data.map((item, index) =>
      applyDeltas(
        item,
        recipe.deltas,
        transformsMap,
        sourceData && Array.isArray(sourceData) ? sourceData[index] : undefined
      )
    );
  }

  // Single object mode
  return applyDeltas(data, recipe.deltas, transformsMap, sourceData);
};

/**
 * Apply delta operations to an object
 *
 * Operations are applied sequentially. Each operation modifies the object in-place.
 *
 * @param data - Input object
 * @param deltas - Delta operations to apply
 * @param transforms - Available transforms
 * @param sourceData - Original source data (for value lookup)
 * @returns Transformed object
 */
export const applyDeltas = (
  data: any,
  deltas: DeltaOp[],
  transforms: Map<string, Transform>,
  sourceData?: any
): any => {
  // Clone the input to avoid mutations
  let result = JSON.parse(JSON.stringify(data));

  // Apply each delta sequentially
  for (const delta of deltas) {
    result = applyDelta(result, delta, transforms, sourceData);
  }

  return result;
};

/**
 * Apply updateParams operation - update parameters of an existing transform
 */
const applyUpdateParams = (data: any, delta: import('./types-v4').UpdateParamsOp): any => {
  if (typeof data !== 'object' || data === null) {
    logger.warn('Cannot update params in non-object data');
    return data;
  }

  // Defensive: If no transforms array, nothing to update
  if (!data._transforms || !Array.isArray(data._transforms)) {
    logger.warn('No _transforms array found on data, cannot update params');
    return data;
  }

  // Defensive: If index out of bounds, do nothing
  if (delta.transformIndex < 0 || delta.transformIndex >= data._transforms.length) {
    logger.warn(`Transform index ${delta.transformIndex} out of bounds`);
    return data;
  }

  // Clone transforms array to avoid mutation
  const newTransforms = data._transforms.map((t: any, idx: number) => {
    if (idx === delta.transformIndex) {
      return {
        ...t,
        params: delta.params,
      };
    }
    return t;
  });

  return {
    ...data,
    _transforms: newTransforms,
  };
};

/**
 * Apply a single delta operation
 */
const applyDelta = (
  data: any,
  delta: DeltaOp,
  transforms: Map<string, Transform>,
  sourceData?: any
): any => {
  switch (delta.op) {
    case 'retain':
      return applyRetain(data, delta);
    case 'insert':
      return applyInsert(data, delta, sourceData, transforms);
    case 'delete':
      return applyDelete(data, delta);
    case 'transform':
      return applyTransform(data, delta, transforms, sourceData);
    case 'rename':
      return applyRename(data, delta);
    case 'updateParams':
      return applyUpdateParams(data, delta);
    default:
      logger.warn(`Unknown delta operation: ${(delta as any).op}`);
      return data;
  }
};

/**
 * Apply retain operation - no-op, used for composition
 */
const applyRetain = (data: any, _delta: RetainOp): any => {
  // Retain is primarily for delta composition/transformation
  // When applying to final data, it's a no-op
  return data;
};

/**
 * Apply insert operation - add a new property
 */
const applyInsert = (
  data: any,
  delta: InsertOp,
  sourceData?: any,
  transforms?: Map<string, Transform>
): any => {
  if (typeof data !== 'object' || data === null) {
    logger.warn('Cannot insert into non-object data');
    return data;
  }

  // Determine the value to insert
  let value = delta.value;

  // If created by a structural transform, reconstruct the value
  if (delta.createdBy && delta.sourceKey && sourceData && typeof sourceData === 'object') {
    const sourceValue = sourceData[delta.sourceKey];
    const { transformName, params, resultKey } = delta.createdBy;

    console.log('[applyInsert] Structural transform:', {
      transformName,
      params,
      resultKey,
      sourceValue,
      hasTransforms: !!transforms,
      transformsSize: transforms?.size,
    });

    // Find the transform function
    const transformFn = transforms?.get(transformName);

    console.log('[applyInsert] Transform found:', !!transformFn);

    if (transformFn) {
      // Apply the transform to get the structural result
      const result = transformFn.fn(sourceValue, ...(params || []));

      console.log('[applyInsert] Transform result:', result);

      // Extract the value using resultKey
      if (result && typeof result === 'object' && result.__structuralChange) {
        if (result.object && resultKey !== undefined) {
          // For toObject: result.object = { key1: value1, key2: value2 }
          // resultKey is the KEY (string), not an index
          console.log('[applyInsert] result.object:', result.object);
          console.log('[applyInsert] resultKey:', resultKey, 'type:', typeof resultKey);

          if (typeof resultKey === 'string') {
            // Extract by key name
            value = result.object[resultKey];
          } else {
            // Extract by index (for compatibility)
            const entries = Object.entries(result.object);
            const entry = entries[resultKey as number];
            if (entry) {
              value = entry[1];
            }
          }

          console.log('[applyInsert] Extracted value:', value);
        } else if (result.parts && typeof resultKey === 'number') {
          // For split: result.parts = [part1, part2, ...]
          value = result.parts[resultKey];
        }
      }
    } else {
      logger.warn(`Transform ${transformName} not found for structural insert`);
    }
  }
  // For restore operations (NOT created by transforms), try to get value from sourceData
  else if (!delta.createdBy && delta.sourceKey && sourceData && typeof sourceData === 'object') {
    const sourceValue = sourceData[delta.sourceKey];
    if (sourceValue !== undefined) {
      value = sourceValue;
    }
  }

  console.log(`[applyInsert] Inserting ${delta.key} =`, value);

  // Insert the property
  return {
    ...data,
    [delta.key]: value,
  };
};

/**
 * Apply delete operation - remove a property
 */
const applyDelete = (data: any, delta: DeleteOp): any => {
  if (typeof data !== 'object' || data === null) {
    logger.warn('Cannot delete from non-object data');
    return data;
  }

  // Remove the property using destructuring
  const { [delta.key]: _removed, ...result } = data;
  return result;
};

/**
 * Apply transform operation - transform a property value
 */
const applyTransform = (
  data: any,
  delta: TransformOp,
  transforms: Map<string, Transform>,
  sourceData?: any
): any => {
  if (typeof data !== 'object' || data === null) {
    logger.warn('Cannot transform non-object data');
    return data;
  }

  const transform = transforms.get(delta.transformName);
  if (!transform) {
    logger.warn(`Transform "${delta.transformName}" not found, skipping`);
    return data;
  }

  // 🔥 Evaluate condition stack - ALL conditions must be true
  if (delta.conditionStack && delta.conditionStack.length > 0) {
    // Use sourceData for condition evaluation to get original values
    const evaluationData = sourceData && typeof sourceData === 'object' ? sourceData : data;

    for (const condition of delta.conditionStack) {
      const conditionFn = transforms.get(condition.conditionName);
      if (!conditionFn) {
        logger.warn(`Condition "${condition.conditionName}" not found, skipping transform`);
        return data; // Skip this transform if condition is missing
      }

      // ✅ Use the 'condition' function (not 'fn') to evaluate conditions
      if (!conditionFn.condition) {
        logger.warn(`Transform "${condition.conditionName}" is not a condition, skipping`);
        return data;
      }

      const currentValue = evaluationData[delta.key];
      const conditionResult = conditionFn.condition(currentValue, ...condition.conditionParams);

      // If any condition is false, skip this transform
      if (!conditionResult) {
        return data;
      }
    }
  }

  // Get current value
  let currentValue = data[delta.key];

  // For conditional transforms, use sourceData if available
  if (delta.isCondition && sourceData && typeof sourceData === 'object') {
    currentValue = sourceData[delta.key] ?? currentValue;
  }

  // Apply the transform
  const transformedValue = transform.fn(currentValue, ...delta.params);

  // Update the property
  return {
    ...data,
    [delta.key]: transformedValue,
  };
};

/**
 * Apply rename operation - change property key
 */
const applyRename = (data: any, delta: RenameOp): any => {
  if (typeof data !== 'object' || data === null) {
    logger.warn('Cannot rename in non-object data');
    return data;
  }

  if (!(delta.from in data)) {
    logger.warn(`Cannot rename: property "${delta.from}" not found`);
    return data;
  }

  // Create new object with renamed property
  const result: any = {};
  for (const key in data) {
    if (key === delta.from) {
      result[delta.to] = data[key];
    } else {
      result[key] = data[key];
    }
  }

  return result;
};

/**
 * Compose two delta sequences into one
 *
 * Given deltas A and B, returns a single delta sequence that has the same effect
 * as applying A then B.
 *
 * This is useful for:
 * - Merging multiple recipes
 * - Optimizing delta sequences
 * - Undo/redo operations
 */
export const composeDeltas = (first: DeltaOp[], second: DeltaOp[]): DeltaOp[] => {
  // Simple concatenation for now
  // TODO: Implement proper composition with conflict resolution
  return [...first, ...second];
};

/**
 * Transform two concurrent delta sequences (Operational Transformation)
 *
 * Given concurrent deltas A and B that were both applied to the same base state,
 * returns A' such that applying B then A' has the same effect as applying A then B.
 *
 * This is useful for:
 * - Collaborative editing
 * - Conflict resolution
 * - Concurrent recipe application
 */
export const transformDeltas = (
  first: DeltaOp[],
  second: DeltaOp[],
  _priority: 'first' | 'second' = 'first'
): DeltaOp[] => {
  // TODO: Implement Operational Transformation algorithm
  // For now, return first deltas unchanged
  logger.warn('Delta transformation not yet implemented, returning first sequence');
  return first;
};
