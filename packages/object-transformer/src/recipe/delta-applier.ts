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
  UpdateParamsOp,
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

  // Track which structural inserts we've already applied
  const appliedStructuralInserts = new Set<string>();

  // Track opId → current key mapping for resolving nested operations
  const opIdToKey = new Map<string, string>();

  // Cache for condition evaluations to avoid re-computation
  const conditionCache = new Map<string, boolean>();

  // Keep the original sourceData for reference
  const originalSourceData = sourceData;

  // Apply each delta sequentially
  for (const delta of deltas) {
    // Skip structural InsertOp if we've already applied it for this exact operation
    // Use opId to ensure we only skip true duplicates, not chained transformations
    if (delta.op === 'insert' && delta.createdBy && delta.sourceKey && 'opId' in delta) {
      const insertKey = delta.opId || `${delta.sourceKey}:${delta.createdBy.transformName}`;
      if (appliedStructuralInserts.has(insertKey)) {
        continue; // Skip this insert, already applied
      }
      appliedStructuralInserts.add(insertKey);
    }

    // Use result as sourceData so nested operations can access previously created values
    // But fallback to original sourceData if result doesn't have the data yet
    const currentSourceData = result || originalSourceData;

    result = applyDelta(
      result,
      delta,
      transforms,
      currentSourceData,
      opIdToKey,
      deltas,
      conditionCache
    );

    // Track opId → key mapping for Insert and Rename operations
    if ('opId' in delta && delta.opId) {
      if (delta.op === 'insert') {
        opIdToKey.set(delta.opId, delta.key);
      } else if (delta.op === 'rename') {
        opIdToKey.set(delta.opId, delta.to);
      }
    }
  }

  return result;
};

/**
 * Apply a single delta operation
 */
const applyDelta = (
  data: any,
  delta: DeltaOp,
  transforms: Map<string, Transform>,
  sourceData?: any,
  opIdToKey?: Map<string, string>,
  deltaList?: DeltaOp[],
  conditionCache?: Map<string, boolean>
): any => {
  switch (delta.op) {
    case 'retain':
      return applyRetain(data, delta);
    case 'insert':
      return applyInsert(data, delta, sourceData, transforms, opIdToKey, deltaList, conditionCache);
    case 'delete':
      return applyDelete(data, delta, opIdToKey, deltaList, transforms, sourceData, conditionCache);
    case 'transform':
      return applyTransform(
        data,
        delta,
        transforms,
        sourceData,
        opIdToKey,
        deltaList,
        conditionCache
      );
    case 'rename':
      return applyRename(data, delta, opIdToKey, deltaList);
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
 * Resolve the full parent path by following the parentOpId chain
 * This allows operations on deeply nested objects created by structural transforms
 */
const resolveParentPath = (
  parentOpId: string | undefined,
  parentKey: string | undefined,
  opIdToKey: Map<string, string> | undefined,
  deltaList: DeltaOp[] | undefined
): string[] => {
  if (!parentOpId && !parentKey) return [];

  if (parentKey && !parentOpId) return [parentKey];

  if (!parentOpId || !opIdToKey) return parentKey ? [parentKey] : [];

  const path: string[] = [];
  let currentOpId: string | undefined = parentOpId;

  while (currentOpId && opIdToKey) {
    const key = opIdToKey.get(currentOpId);
    if (!key) break;

    path.unshift(key); // Add to beginning to build path from root

    // Find the delta that created this key to get its parent
    const parentDelta = deltaList?.find((d) => 'opId' in d && d.opId === currentOpId);
    if (parentDelta && 'parentOpId' in parentDelta) {
      currentOpId = parentDelta.parentOpId;
    } else {
      break;
    }
  }

  return path;
};

/**
 * Navigate to a nested object using a path
 */
const getNestedObject = (data: any, path: string[]): any => {
  let current = data;
  for (const key of path) {
    if (typeof current !== 'object' || current === null || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
};

/**
 * Update a nested object immutably using a path
 */
const updateNestedObject = (obj: any, path: string[], value: any): any => {
  if (path.length === 0) return value;
  const [first, ...rest] = path;
  return {
    ...obj,
    [first]: updateNestedObject(obj[first], rest, value),
  };
};

/**
 * Apply insert operation - add a new property
 */
const applyInsert = (
  data: any,
  delta: InsertOp,
  sourceData?: any,
  transforms?: Map<string, Transform>,
  opIdToKey?: Map<string, string>,
  deltaList?: DeltaOp[], // Full list of deltas to resolve parent chains
  conditionCache?: Map<string, boolean>
): any => {
  if (typeof data !== 'object' || data === null) {
    logger.warn('Cannot insert into non-object data');
    return data;
  }

  // Resolve the full parent path by following the parentOpId chain
  const resolveParentPath = (opId: string): string[] => {
    const path: string[] = [];
    let currentOpId: string | undefined = opId;

    while (currentOpId && opIdToKey) {
      const key = opIdToKey.get(currentOpId);
      if (!key) break;

      path.unshift(key); // Add to beginning to build path from root

      // Find the delta that created this key to get its parent
      const parentDelta = deltaList?.find((d) => 'opId' in d && d.opId === currentOpId);
      if (parentDelta && 'parentOpId' in parentDelta) {
        currentOpId = parentDelta.parentOpId;
      } else {
        break;
      }
    }

    return path;
  };

  // 🔥 Evaluate conditionStack FIRST (before checking parentPath)
  // This avoids warnings when conditions fail
  if (delta.conditionStack && delta.conditionStack.length > 0) {
    for (const condition of delta.conditionStack) {
      const conditionFn = transforms?.get(condition.conditionName);
      if (!conditionFn) {
        logger.warn(`Condition ${condition.conditionName} not found, skipping insert`);
        return data;
      }

      // Get the value to check
      const valueToCheck =
        delta.sourceKey && sourceData ? sourceData[delta.sourceKey] : delta.value;

      // Apply condition - use the CONDITION function, not the transformation function
      if (!conditionFn.condition) {
        logger.warn(
          `Transform ${condition.conditionName} has no condition function, skipping insert`
        );
        return data;
      }

      // Check cache first to avoid re-evaluation
      // Use simple cache key without JSON.stringify for better performance
      const cacheKey = `${delta.key}:${condition.conditionName}:${valueToCheck}:${condition.conditionParams?.join(',') || ''}`;
      let result: boolean;

      if (conditionCache?.has(cacheKey)) {
        result = conditionCache.get(cacheKey)!;
      } else {
        result = conditionFn.condition(valueToCheck, ...(condition.conditionParams || []));
        conditionCache?.set(cacheKey, result);
      }

      // If any condition is false, skip silently (no warnings about missing parents)
      if (!result) {
        return data;
      }
    }
  }

  // Resolve parentKey from parentOpId if provided
  let parentPath: string[] = [];
  if (delta.parentOpId && opIdToKey) {
    parentPath = resolveParentPath(delta.parentOpId);
    if (parentPath.length === 0) {
      logger.warn(`Cannot resolve parentOpId "${delta.parentOpId}" to a path`);
    }
  } else if (delta.parentKey) {
    parentPath = [delta.parentKey];
  }

  // If parentPath is specified, insert within the nested object
  if (parentPath.length > 0) {
    // Navigate to the parent object using the full path
    let parent: any = data;
    for (const key of parentPath) {
      if (!(key in parent)) {
        // Silently skip if parent not found - it may have been conditionally created
        return data;
      }
      parent = parent[key];
      if (typeof parent !== 'object' || parent === null) {
        // Silently skip if parent is not an object
        return data;
      }
    }

    // Navigate to the same parent in sourceData
    let nestedSourceData = sourceData;
    for (const key of parentPath) {
      if (nestedSourceData && typeof nestedSourceData === 'object' && key in nestedSourceData) {
        nestedSourceData = nestedSourceData[key];
      } else {
        // If path doesn't exist in sourceData, use current parent as source
        nestedSourceData = parent;
        break;
      }
    }

    // Apply insert to nested object
    const updatedParent = applyInsert(
      parent,
      { ...delta, parentKey: undefined, parentOpId: undefined }, // Remove parent refs to avoid infinite recursion
      nestedSourceData,
      transforms,
      opIdToKey,
      deltaList,
      conditionCache
    );

    // Reconstruct the data with the updated parent at the correct path
    const updateNestedObject = (obj: any, path: string[], value: any): any => {
      if (path.length === 0) return value;
      const [first, ...rest] = path;
      return {
        ...obj,
        [first]: updateNestedObject(obj[first], rest, value),
      };
    };

    return updateNestedObject(data, parentPath, updatedParent);
  }

  // Determine the value to insert
  let value = delta.value;

  // If created by a structural transform, reconstruct the value
  if (delta.createdBy && delta.sourceKey && sourceData && typeof sourceData === 'object') {
    const sourceValue = sourceData[delta.sourceKey];
    const { transformName, params, resultKey } = delta.createdBy;

    // Find the transform function
    const transformFn = transforms?.get(transformName);

    if (transformFn) {
      // Apply the transform to get the structural result
      const result = transformFn.fn(sourceValue, ...(params || []));

      // 🔥 DYNAMIC STRUCTURAL INSERTS
      // If this is a structural transform, we need to insert ALL parts, not just one
      if (result && typeof result === 'object' && result.__structuralChange) {
        if (result.parts && Array.isArray(result.parts)) {
          // This is a split operation - insert ALL parts dynamically
          const allInserts: Record<string, any> = {};

          result.parts.forEach((part: any, index: number) => {
            const partKey = delta.key.replace(/_\d+$/, `_${index}`);
            allInserts[partKey] = part;
          });

          // Return data with ALL parts inserted at once
          return {
            ...data,
            ...allInserts,
          };
        } else if (result.object !== undefined) {
          // For toObject with parentOpId (nested): extract the specific part using resultKey
          // For toObject without parentOpId (root level): expand all properties
          if (delta.parentOpId) {
            // Nested structural transform: extract the value using resultKey
            if (resultKey !== undefined && typeof result.object === 'object') {
              value = result.object[resultKey];
            } else {
              value = result.object;
            }
          } else {
            // Root-level toObject: insert ALL object properties dynamically
            if (typeof result.object === 'object') {
              const allInserts: Record<string, any> = {};

              Object.entries(result.object).forEach(([key, val]) => {
                const partKey = delta.key.replace(/_[^_]+$/, `_${key}`);
                allInserts[partKey] = val;
              });

              return {
                ...data,
                ...allInserts,
              };
            }
          }
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

  // Insert the property
  return {
    ...data,
    [delta.key]: value,
  };
};

/**
 * Apply delete operation - remove a property
 * Supports nested deletes via parentOpId
 */
const applyDelete = (
  data: any,
  delta: DeleteOp,
  opIdToKey?: Map<string, string>,
  deltaList?: DeltaOp[],
  transforms?: Map<string, Transform>,
  sourceData?: any,
  conditionCache?: Map<string, boolean>
): any => {
  if (typeof data !== 'object' || data === null) {
    logger.warn('Cannot delete from non-object data');
    return data;
  }

  // 🔥 Evaluate conditionStack FIRST (before resolving parentPath)
  // This avoids warnings when conditions fail
  if (delta.conditionStack && delta.conditionStack.length > 0) {
    // Use sourceData for condition evaluation to get original values
    const evaluationData = sourceData && typeof sourceData === 'object' ? sourceData : data;

    for (const condition of delta.conditionStack) {
      const conditionFn = transforms?.get(condition.conditionName);
      if (!conditionFn) {
        logger.warn(`Condition "${condition.conditionName}" not found, skipping delete`);
        return data; // Skip delete if condition is missing
      }

      // ✅ Use the 'condition' function to evaluate conditions
      if (!conditionFn.condition) {
        logger.warn(`Transform "${condition.conditionName}" is not a condition, skipping delete`);
        return data;
      }

      const currentValue = evaluationData[delta.key];

      // Check cache first to avoid re-evaluation
      // Use simple cache key without JSON.stringify for better performance
      const cacheKey = `${delta.key}:${condition.conditionName}:${currentValue}:${condition.conditionParams.join(',')}`;
      let conditionResult: boolean;

      if (conditionCache?.has(cacheKey)) {
        conditionResult = conditionCache.get(cacheKey)!;
      } else {
        conditionResult = conditionFn.condition(currentValue, ...condition.conditionParams);
        conditionCache?.set(cacheKey, conditionResult);
      }

      // If any condition is false, skip this delete silently
      if (!conditionResult) {
        return data;
      }
    }
  }

  // Resolve parent path for nested deletes
  const parentPath = resolveParentPath(delta.parentOpId, delta.parentKey, opIdToKey, deltaList);

  if (parentPath.length > 0) {
    // Navigate to parent object
    const parent = getNestedObject(data, parentPath);
    if (!parent || typeof parent !== 'object') {
      // Silently skip - parent may be conditionally created
      return data;
    }

    // Delete from parent
    const { [delta.key]: _removed, ...updatedParent } = parent;

    // Update data with modified parent
    return updateNestedObject(data, parentPath, updatedParent);
  }

  // Root level delete
  const { [delta.key]: _removed, ...result } = data;
  return result;
};

/**
 * Apply transform operation - transform a property value
 * Supports nested transforms via parentOpId
 */
const applyTransform = (
  data: any,
  delta: TransformOp,
  transforms: Map<string, Transform>,
  sourceData?: any,
  opIdToKey?: Map<string, string>,
  deltaList?: DeltaOp[],
  conditionCache?: Map<string, boolean>
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

  // 🔥 Evaluate condition stack FIRST (before checking parentPath)
  // This avoids warnings when conditions fail
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

      // Check cache first to avoid re-evaluation
      // Use simple cache key without JSON.stringify for better performance
      const cacheKey = `${delta.key}:${condition.conditionName}:${currentValue}:${condition.conditionParams.join(',')}`;
      let conditionResult: boolean;

      if (conditionCache?.has(cacheKey)) {
        conditionResult = conditionCache.get(cacheKey)!;
      } else {
        conditionResult = conditionFn.condition(currentValue, ...condition.conditionParams);
        conditionCache?.set(cacheKey, conditionResult);
      }

      // If any condition is false, skip this transform silently
      if (!conditionResult) {
        return data;
      }
    }
  }

  // Resolve parent path for nested transforms
  const parentPath = resolveParentPath(delta.parentOpId, delta.parentKey, opIdToKey, deltaList);

  if (parentPath.length > 0) {
    // Navigate to parent object
    const parent = getNestedObject(data, parentPath);
    if (!parent || typeof parent !== 'object') {
      // Silently skip - parent may be conditionally created
      return data;
    }

    // Get nested sourceData for this parent
    const nestedSourceData = getNestedObject(sourceData, parentPath);

    // Apply transform to nested property
    const transformedParent = applyTransform(
      parent,
      { ...delta, parentKey: undefined, parentOpId: undefined },
      transforms,
      nestedSourceData,
      opIdToKey,
      deltaList,
      conditionCache
    );

    // Update data with modified parent
    return updateNestedObject(data, parentPath, transformedParent);
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
 * Supports nested renames via parentOpId
 */
const applyRename = (
  data: any,
  delta: RenameOp,
  opIdToKey?: Map<string, string>,
  deltaList?: DeltaOp[]
): any => {
  if (typeof data !== 'object' || data === null) {
    logger.warn('Cannot rename in non-object data');
    return data;
  }

  // Resolve parent path for nested renames
  const parentPath = resolveParentPath(delta.parentOpId, delta.parentKey, opIdToKey, deltaList);

  if (parentPath.length > 0) {
    // Navigate to parent object
    const parent = getNestedObject(data, parentPath);
    if (!parent || typeof parent !== 'object') {
      // Silently skip - parent may be conditionally created
      return data;
    }

    if (!(delta.from in parent)) {
      // Silently skip - property may be conditionally created
      return data;
    }

    // Create new parent object with renamed property using spread operator (O(1) vs O(n) loop)
    const { [delta.from]: value, ...rest } = parent;
    const newParent = { ...rest, [delta.to]: value };

    // Update data with modified parent
    return updateNestedObject(data, parentPath, newParent);
  }

  // Root level rename
  if (!(delta.from in data)) {
    // Silently skip - property may be conditionally created
    return data;
  }

  // Create new object with renamed property using spread operator (O(1) vs O(n) loop)
  const { [delta.from]: value, ...rest } = data;
  return { ...rest, [delta.to]: value };
};

/**
 * Apply updateParams operation - update parameters of an existing transform
 *
 * This operation doesn't modify the data directly. Instead, it updates the parameters
 * of a transform operation in the recipe. The actual transformation with new parameters
 * will be applied when the corresponding transform delta is executed.
 *
 * This is a metadata operation that affects how subsequent operations are interpreted.
 */
const applyUpdateParams = (data: any, _delta: UpdateParamsOp): any => {
  // UpdateParams is a metadata operation that modifies the recipe itself,
  // not the data. When applying a recipe, this operation is effectively a no-op
  // because the parameters have already been updated in the corresponding
  // TransformOp delta before application.
  //
  // The actual parameter update happens at the recipe building/editing stage,
  // not during application.
  return data;
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
