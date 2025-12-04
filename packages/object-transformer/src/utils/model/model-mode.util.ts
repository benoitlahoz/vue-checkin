/**
 * Count nested properties in an object (recursive)
 */
const countNestedProperties = (obj: any): number => {
  if (obj === null || obj === undefined) return 0;
  if (typeof obj !== 'object') return 1;
  if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + countNestedProperties(item), 0);
  }
  return Object.keys(obj).reduce((sum, key) => sum + 1 + countNestedProperties(obj[key]), 0);
};

/**
 * Find the most complete object in an array (object with most properties)
 */
export const findMostCompleteObject = (items: any[]): number => {
  if (!Array.isArray(items) || items.length === 0) return 0;

  return items.reduce((maxIndex, item, index) => {
    const currentCount = countNestedProperties(item);
    const maxCount = countNestedProperties(items[maxIndex]);
    return currentCount > maxCount ? index : maxIndex;
  }, 0);
};

/**
 * Detect if data suggests model mode (array of objects with similar structure)
 */
export const suggestModelMode = (data: any): boolean => {
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
export const getDataForMode = (data: any, mode: 'object' | 'model', templateIndex: number): any => {
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
export const mergeWithTemplate = (target: any, template: any): any => {
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

  const merged = { ...target };

  Object.keys(template).forEach((key) => {
    const templateValue = template[key];

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
export const normalizeArrayWithTemplate = (items: any[], templateIndex: number): any[] => {
  if (!Array.isArray(items) || items.length === 0) return items;

  const template = items[templateIndex];
  if (typeof template !== 'object' || template === null) return items;

  return items.map((item, index) => {
    if (index === templateIndex) return item; // Keep template as-is
    return mergeWithTemplate(item, template);
  });
};
