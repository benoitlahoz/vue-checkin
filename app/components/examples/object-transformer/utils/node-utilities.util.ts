import type { ObjectNode, ObjectNodeType } from '..';
import { all, maybe } from './functional.util';

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
const findUniqueKey = (existingKeys: Set<string>, baseKey: string, counter: number): string => {
  const candidate = `${baseKey}_${counter}`;
  return existingKeys.has(candidate)
    ? findUniqueKey(existingKeys, baseKey, counter + 1)
    : candidate;
};

export const autoRenameKey = (parent: ObjectNode, base: string): string => {
  const safeBase = sanitizeKey(base) || 'key';
  const existingKeys = new Set(
    parent.children?.map((c) => c.key).filter((k): k is string => Boolean(k)) || []
  );

  return existingKeys.has(safeBase) ? findUniqueKey(existingKeys, safeBase, 1) : safeBase;
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

// Check if property was added (from split)
export const isAddedProperty = (node: ObjectNode): boolean => {
  const key = node.key;
  return key ? /_\d+$/.test(key) : false;
};

// Get CSS classes based on node state
export const getKeyClasses = (node: ObjectNode): string => {
  if (isAddedProperty(node)) return 'font-semibold text-blue-600';
  if (node.keyModified) return 'font-semibold text-yellow-600';
  return 'font-semibold';
};

// Generate unique key for v-for (with error handling)
export const generateChildKey = (child: ObjectNode, index: number): string => {
  const fallback = `${child.key}-${index}-${typeof child.value}-${Date.now()}`;
  return maybe(() => {
    const valueStr = JSON.stringify(child.value);
    const encoded = btoa(encodeURIComponent(valueStr).slice(0, 100));
    return `${child.key}-${index}-${encoded}`;
  }, fallback)(null);
};
