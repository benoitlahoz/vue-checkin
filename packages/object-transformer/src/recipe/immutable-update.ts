/**
 * Immutable Update Utilities
 *
 * Provides structural sharing for efficient immutable updates.
 * Only clones the path that is being modified, keeping references to unchanged parts.
 */

import type { Path } from './types';

/**
 * Update a value at a specific path immutably
 * Uses structural sharing - only clones modified branches
 *
 * @param obj - Object to update
 * @param path - Path to the value to update
 * @param updater - Function that transforms the value
 * @returns New object with the update applied
 *
 * @example
 * const data = { user: { name: 'John', age: 30 } }
 * const result = updateAt(data, ['user', 'age'], age => age + 1)
 * // result: { user: { name: 'John', age: 31 } }
 * // data.user !== result.user (cloned)
 * // Original data unchanged
 */
export const updateAt = <T = any>(obj: T, path: Path, updater: (value: any) => any): T => {
  // Base case: path is empty, apply updater directly
  if (path.length === 0) {
    return updater(obj);
  }

  // Recursive case: navigate down the path
  const [head, ...tail] = path;

  // Handle arrays
  if (Array.isArray(obj)) {
    const index = parseInt(head);
    if (isNaN(index) || index < 0 || index >= obj.length) {
      // Invalid index, return unchanged
      return obj;
    }

    // Clone array with updated element at index
    return [
      ...obj.slice(0, index),
      updateAt(obj[index], tail, updater),
      ...obj.slice(index + 1),
    ] as T;
  }

  // Handle objects
  if (obj && typeof obj === 'object') {
    return {
      ...obj,
      [head]: updateAt((obj as any)[head], tail, updater),
    };
  }

  // Cannot navigate further (primitive value), return unchanged
  return obj;
};

/**
 * Delete a value at a specific path immutably
 *
 * @param obj - Object to delete from
 * @param path - Path to the value to delete
 * @returns New object with the deletion applied
 *
 * @example
 * const data = { user: { name: 'John', age: 30 } }
 * const result = deleteAt(data, ['user', 'age'])
 * // result: { user: { name: 'John' } }
 */
export const deleteAt = <T = any>(obj: T, path: Path): T => {
  if (path.length === 0) {
    // Cannot delete root
    return obj;
  }

  if (path.length === 1) {
    const [key] = path;

    // Delete from array
    if (Array.isArray(obj)) {
      const index = parseInt(key);
      if (isNaN(index) || index < 0 || index >= obj.length) {
        return obj;
      }
      return [...obj.slice(0, index), ...obj.slice(index + 1)] as T;
    }

    // Delete from object
    if (obj && typeof obj === 'object') {
      const { [key]: _, ...rest } = obj as any;
      return rest as T;
    }

    return obj;
  }

  // Recursive case: navigate to parent and delete from there
  const [head, ...tail] = path;
  return updateAt(obj, [head], (parent) => deleteAt(parent, tail));
};

/**
 * Rename a key at a specific path immutably
 *
 * @param obj - Object to rename in
 * @param path - Path to the parent object
 * @param from - Original key name
 * @param to - New key name
 * @returns New object with the rename applied
 *
 * @example
 * const data = { user: { firstName: 'John' } }
 * const result = renameAt(data, ['user'], 'firstName', 'name')
 * // result: { user: { name: 'John' } }
 */
export const renameAt = <T = any>(obj: T, path: Path, from: string, to: string): T => {
  return updateAt(obj, path, (parent) => {
    if (!parent || typeof parent !== 'object' || Array.isArray(parent)) {
      return parent;
    }

    const { [from]: value, ...rest } = parent;

    // If key doesn't exist, return unchanged
    if (value === undefined) {
      return parent;
    }

    // Return object with renamed key
    return { ...rest, [to]: value };
  });
};

/**
 * Add a value at a specific path immutably
 *
 * @param obj - Object to add to
 * @param path - Path to the parent
 * @param key - Key of the new property/element
 * @param value - Value to add
 * @returns New object with the addition applied
 *
 * @example
 * const data = { user: { name: 'John' } }
 * const result = addAt(data, ['user'], 'age', 30)
 * // result: { user: { name: 'John', age: 30 } }
 */
export const addAt = <T = any>(obj: T, path: Path, key: string, value: any): T => {
  return updateAt(obj, path, (parent) => {
    // Add to array
    if (Array.isArray(parent)) {
      const index = parseInt(key);
      if (isNaN(index)) {
        // Invalid index for array, append
        return [...parent, value];
      }
      // Insert at index
      return [...parent.slice(0, index), value, ...parent.slice(index)];
    }

    // Add to object
    if (parent && typeof parent === 'object') {
      return { ...parent, [key]: value };
    }

    // Cannot add to primitive, return unchanged
    return parent;
  });
};

/**
 * Get a value at a specific path
 * Pure read operation (no cloning)
 *
 * @param obj - Object to read from
 * @param path - Path to the value
 * @returns Value at path, or undefined if not found
 */
export const getAt = (obj: any, path: Path): any => {
  let current = obj;

  for (const segment of path) {
    if (current == null) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = parseInt(segment);
      if (isNaN(index)) {
        return undefined;
      }
      current = current[index];
    } else if (typeof current === 'object') {
      current = current[segment];
    } else {
      return undefined;
    }
  }

  return current;
};

/**
 * Check if a path exists in an object
 *
 * @param obj - Object to check
 * @param path - Path to check
 * @returns true if the path exists
 */
export const hasPath = (obj: any, path: Path): boolean => {
  let current = obj;

  for (const segment of path) {
    if (current == null || typeof current !== 'object') {
      return false;
    }

    if (Array.isArray(current)) {
      const index = parseInt(segment);
      if (isNaN(index) || index < 0 || index >= current.length) {
        return false;
      }
      current = current[index];
    } else {
      if (!(segment in current)) {
        return false;
      }
      current = current[segment];
    }
  }

  return true;
};
