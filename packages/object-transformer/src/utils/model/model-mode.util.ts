/**
 * Count nested properties in an object (recursive)
 */

import type { PropertyVariation } from '../../types';

const countNestedProperties = (obj: unknown): number => {
  if (obj === null || obj === undefined) return 0;
  if (typeof obj !== 'object') return 1;
  if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + countNestedProperties(item), 0);
  }
  return Object.keys(obj).reduce(
    (sum, key) => sum + 1 + countNestedProperties(obj[key as keyof typeof obj]),
    0
  );
};

/**
 * Find the most complete object in an array (object with most properties)
 */
export const findMostCompleteObject = (items: unknown[]): number => {
  if (!Array.isArray(items) || items.length === 0) return 0;

  return items.reduce<number>((maxIndex, item, index) => {
    const currentCount = countNestedProperties(item);
    const maxCount = countNestedProperties(items[maxIndex]);
    return currentCount > maxCount ? index : maxIndex;
  }, 0);
};

/**
 * Detect if data suggests model mode (array of objects with similar structure)
 */
export const suggestModelMode = (data: unknown): boolean => {
  if (!Array.isArray(data) || data.length === 0) return false;

  // Check if all items are objects
  const allObjects = data.every(
    (item) => item !== null && typeof item === 'object' && !Array.isArray(item)
  );

  return allObjects;
};

/**
 * Get the object at template index, or the full array in object mode
 */
export const getDataForMode = (
  data: unknown,
  mode: 'object' | 'model',
  templateIndex: number
): unknown => {
  if (mode === 'object') {
    return data; // Full data (array or object)
  }

  if (mode === 'model' && Array.isArray(data)) {
    return data[templateIndex] || data[0]; // Template object only
  }

  return data;
};

/**
 * Merge an object with missing properties from template (creates undefined props)
 */
export const mergeWithTemplate = (target: unknown, template: unknown): unknown => {
  // If template is not an object, return target as-is
  if (typeof template !== 'object' || template === null) return target;

  // If target is not an object, return undefined (property missing)
  if (typeof target !== 'object' || target === null) return undefined;

  // If template is an array, target should be an array too
  if (Array.isArray(template)) {
    if (Array.isArray(target)) {
      return target; // Keep target array as-is
    }
    return []; // Create empty array if target is not an array
  }

  // If target is an array but template is an object, return empty array
  if (Array.isArray(target)) {
    return [];
  }

  // If template is a Date, try to preserve/restore the Date
  if (template instanceof Date) {
    if (target instanceof Date) {
      return target; // Already a Date
    }
    // Try to parse ISO string back to Date - more permissive ISO 8601 detection
    if (typeof target === 'string') {
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
      if (isoDateRegex.test(target)) {
        const parsed = new Date(target);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    return undefined; // Can't convert to Date
  }

  const merged: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  const templateObj = template as Record<string, unknown>;

  Object.keys(templateObj).forEach((key) => {
    const templateValue = templateObj[key];

    if (!(key in merged)) {
      // Property missing in target - create appropriate default value based on type
      if (Array.isArray(templateValue)) {
        merged[key] = [];
      } else if (templateValue instanceof Date) {
        merged[key] = undefined;
      } else if (typeof templateValue === 'object' && templateValue !== null) {
        // For nested objects, recursively merge with empty object to get full structure
        merged[key] = mergeWithTemplate({}, templateValue);
      } else {
        merged[key] = undefined;
      }
    } else if (
      typeof templateValue === 'object' &&
      templateValue !== null &&
      !Array.isArray(templateValue) &&
      !(templateValue instanceof Date)
    ) {
      // Recursive merge for nested objects (but not arrays or dates)
      merged[key] = mergeWithTemplate(merged[key], templateValue);
    }
  });

  return merged;
};

/**
 * Ensure all objects in array have the same structure as template
 */
export const normalizeArrayWithTemplate = (items: unknown[], templateIndex: number): unknown[] => {
  if (!Array.isArray(items) || items.length === 0) return items;

  const template = items[templateIndex];
  if (typeof template !== 'object' || template === null) return items;

  return items.map((item, index) => {
    if (index === templateIndex) return item; // Keep template as-is
    return mergeWithTemplate(item, template);
  });
};

/**
 * Analyze differences between objects in an array
 * Returns a summary of property variations
 */

/**
 * Extract transformed data from a tree node (like ObjectPreview does)
 */
interface NodeLike {
  deleted?: boolean;
  children?: NodeLike[];
  type?: string;
  key?: string;
  value?: unknown;
}

const buildValueFromNode = (node: NodeLike): unknown => {
  if (node.deleted) return undefined;

  // If node has children (from structural transforms), build from children
  if (node.children && node.children.length > 0) {
    const activeChildren = node.children.filter((child) => !child.deleted);

    // Build array if type is 'array'
    if (node.type === 'array') {
      return activeChildren.map(buildValueFromNode).filter((v) => v !== undefined);
    }

    // Build object (for 'object' type or structural transforms)
    if (node.type === 'object' || activeChildren.some((c) => c.key)) {
      return activeChildren.reduce(
        (acc, child) => {
          const value = buildValueFromNode(child);
          if (value !== undefined && child.key) {
            acc[child.key] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>
      );
    }
  }

  // For primitives without children, return the value
  return node.value;
};

/**
 * Build transformed data array from tree (for analyzing actual transformed structure)
 */
export const buildTransformedDataFromTree = (tree: NodeLike): unknown[] => {
  if (!tree || tree.type !== 'array' || !tree.children) return [];

  return tree.children
    .filter((child) => !child.deleted)
    .map(buildValueFromNode)
    .filter((v) => v !== undefined);
};

export const analyzeArrayDifferences = (items: unknown[]): PropertyVariation[] => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const propertyCount = new Map<string, number>();
  const totalObjects = items.length;

  // Count occurrences of each property across all objects
  const countProperties = (obj: unknown, prefix: string = '') => {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return;

    const objRecord = obj as Record<string, unknown>;
    Object.keys(objRecord).forEach((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      propertyCount.set(fullKey, (propertyCount.get(fullKey) || 0) + 1);

      // Recursively count nested properties
      const value = objRecord[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        countProperties(value, fullKey);
      }
    });
  };

  items.forEach((item) => countProperties(item));

  // Convert to PropertyVariation array
  const variations: PropertyVariation[] = [];
  propertyCount.forEach((presentIn, property) => {
    const missingIn = totalObjects - presentIn;
    const coverage = Math.round((presentIn / totalObjects) * 100);

    variations.push({
      property,
      presentIn,
      missingIn,
      totalObjects,
      coverage,
    });
  });

  // Sort by coverage (properties present in fewer objects first)
  return variations.sort((a, b) => a.coverage - b.coverage);
};
