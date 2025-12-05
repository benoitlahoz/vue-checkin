import type { ObjectNodeData, ObjectNodeType } from '../../types';
import { all, maybe } from 'vue-airport';
import {
  getOriginalKey,
  isKeyModified,
  getKeyMetadata,
  markKeyAsModified,
} from './node-key-metadata.util';

/**
 * Key Validation - Pure predicates and validation
 */

export const keyGuards = [
  '__proto__',
  'prototype',
  'constructor',
  'toString',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
];

// Validation predicates
const isNotEmpty = (key: string): boolean => Boolean(key);
const isNotForbidden = (key: string): boolean => !keyGuards.includes(key);
const isNotDunderWrapped = (key: string): boolean => !(key.startsWith('__') && key.endsWith('__'));
const hasNoDots = (key: string): boolean => !key.includes('.');

// Composed validation
export const sanitizeKey = (key: string): string | null =>
  all(isNotEmpty, isNotForbidden, isNotDunderWrapped, hasNoDots)(key) ? key : null;

// Generate unique key using tail recursion
export const findUniqueKey = (
  existingKeys: Set<string>,
  baseKey: string,
  counter: number
): string => {
  const candidate = `${baseKey}_${counter}`;
  return existingKeys.has(candidate)
    ? findUniqueKey(existingKeys, baseKey, counter + 1)
    : candidate;
};

export const autoRenameKey = (parent: ObjectNodeData, base: string): string => {
  const safeBase = sanitizeKey(base) || 'key';
  // Exclude soft deleted nodes from existing keys check
  const existingKeys = new Set(
    parent.children
      ?.filter((c) => !c.deleted)
      .map((c) => c.key)
      .filter((k): k is string => Boolean(k)) || []
  );

  return existingKeys.has(safeBase) ? findUniqueKey(existingKeys, safeBase, 1) : safeBase;
};

// Handle conflicts when restoring a soft deleted node
export const handleRestoreConflict = (
  parent: ObjectNodeData,
  restoredNode: ObjectNodeData
): void => {
  if (!restoredNode.key || !parent.children) return;

  // Find any active node with the same key (but not the node being restored)
  // This includes both added properties AND nodes that were renamed to this key
  const conflictingNode = parent.children.find(
    (c) => c !== restoredNode && c.key === restoredNode.key && !c.deleted
  );

  if (conflictingNode) {
    // The conflicting node needs to be renamed to avoid the conflict
    // If it was an added property or was renamed to this key, give it a unique key
    const existingKeys = new Set(
      parent.children
        .filter((c) => !c.deleted)
        .map((c) => c.key)
        .filter((k): k is string => Boolean(k)) || []
    );

    // Use the restoredNode's key as base to find alternatives (e.g., name -> name_1)
    const newKey = findUniqueKey(existingKeys, restoredNode.key!, 1);

    // Store the CURRENT key as the original before renaming
    // This is important for the recipe system to track the rename correctly
    const conflictingMetadata = getKeyMetadata(conflictingNode);
    const currentKey = conflictingNode.key;

    // Update the node's key to the new unique name
    conflictingNode.key = newKey;
    markKeyAsModified(conflictingNode);

    // Set original to the CURRENT key (before the automatic rename)
    // This ensures the recipe captures: "rename from 'name' to 'name_1'"
    // instead of trying to use an older original key like 'name_object'
    conflictingMetadata.original = currentKey;
  }
};

/**
 * Value Formatting - Type-based formatters
 */

const formatters: Partial<Record<ObjectNodeType, (v: any) => string>> = {
  date: (v) => (v instanceof Date ? v.toISOString() : String(v)),
  function: (v) => `[Function: ${v.name || 'anonymous'}]`,
  bigint: (v) => `${v}n`,
  symbol: (v) => v.toString(),
  undefined: () => 'undefined',
  null: () => 'null',
  object: (v) => {
    try {
      return JSON.stringify(v);
    } catch {
      return '[Circular Object]';
    }
  },
  array: (v) => {
    try {
      return JSON.stringify(v);
    } catch {
      return '[Circular Array]';
    }
  },
};

export const formatValue = (value: any, type: ObjectNodeType): string => {
  // If value is actually a string (e.g., after JSON.stringify transform), return it directly
  if (typeof value === 'string') return value;
  return formatters[type]?.(value) ?? String(value);
};

/**
 * Node Properties - Pure utilities for node inspection
 */

// Check if property was added (from structural transforms like split or stringToObject)
export const isAddedProperty = (node: ObjectNodeData): boolean => {
  // Check the original key (before any renames) to determine if it was added by a transformation
  const keyToCheck = getOriginalKey(node) || node.key;
  if (!keyToCheck) return false;
  // Match patterns: _0, _1, ... (from split) or _object, _original, etc. (from stringToObject)
  return /_\d+$/.test(keyToCheck) || /_[a-zA-Z]+$/.test(keyToCheck);
};

// Get CSS classes based on node state
export const getKeyClasses = (node: ObjectNodeData): string => {
  if (isAddedProperty(node)) return 'font-semibold text-blue-600';
  if (isKeyModified(node)) return 'font-semibold text-yellow-600';
  return 'font-semibold';
};

// Generate unique key for v-for (with error handling)
export const generateChildKey = (child: ObjectNodeData, index: number): string => {
  const fallback = `${child.key}-${index}-${typeof child.value}-${Date.now()}`;
  return maybe(() => {
    const valueStr = JSON.stringify(child.value);
    const encoded = btoa(encodeURIComponent(valueStr).slice(0, 100));
    return `${child.key}-${index}-${encoded}`;
  }, fallback)(null);
};
