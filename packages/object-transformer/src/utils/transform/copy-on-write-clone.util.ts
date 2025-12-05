/**
 * 🟡 OPTIMIZATION: Copy-on-write cloning utilities
 * Only clone objects/arrays that will be modified, reducing memory allocation
 */

/**
 * Track which paths are modified by the recipe
 * This allows us to only clone the necessary branches
 */
export interface ClonePath {
  segments: string[];
  isModified: boolean;
}

/**
 * Build a set of paths that will be modified by the recipe
 */
export const buildModifiedPaths = (
  steps: Array<{ path: string[] }>,
  deletions: string[][],
  renames: Array<{ path: string[] }>
): Set<string> => {
  const modifiedPaths = new Set<string>();

  // Add all step paths and their parents
  steps.forEach((step) => {
    for (let i = 0; i <= step.path.length; i++) {
      const pathKey = step.path.slice(0, i).join('.');
      modifiedPaths.add(pathKey);
    }
  });

  // Add all deletion paths and their parents
  deletions.forEach((path) => {
    for (let i = 0; i <= path.length; i++) {
      const pathKey = path.slice(0, i).join('.');
      modifiedPaths.add(pathKey);
    }
  });

  // Add all rename paths and their parents
  renames.forEach((rename) => {
    for (let i = 0; i <= rename.path.length; i++) {
      const pathKey = rename.path.slice(0, i).join('.');
      modifiedPaths.add(pathKey);
    }
  });

  return modifiedPaths;
};

/**
 * Shallow clone with Date preservation (reserved for future use)
 */
const _shallowClone = (value: any): any => {
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === 'object') return { ...value };
  return value;
};

/**
 * Parse ISO date strings into Date objects
 */
const parseISODate = (value: any): any => {
  if (typeof value === 'string') {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (isoDateRegex.test(value)) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  return value;
};

/**
 * Copy-on-write clone: only clone paths that will be modified
 *
 * @param obj - Object to clone
 * @param modifiedPaths - Set of paths that will be modified
 * @param currentPath - Current path during traversal (for internal use)
 * @returns Cloned object (shallow clone for unmodified branches, deep clone for modified)
 */
export const copyOnWriteClone = (
  obj: any,
  modifiedPaths: Set<string>,
  currentPath: string[] = []
): any => {
  // Primitives and null - no cloning needed
  if (obj === null || typeof obj !== 'object') {
    return parseISODate(obj);
  }

  // Date objects - always clone
  if (obj instanceof Date) return new Date(obj.getTime());

  const pathKey = currentPath.join('.');
  const willBeModified = modifiedPaths.has(pathKey);

  // If this path won't be modified, check if any children will be
  const hasModifiedChildren = Array.from(modifiedPaths).some(
    (path) => path.startsWith(pathKey) && path !== pathKey
  );

  // If neither this path nor its children are modified, return as-is
  if (!willBeModified && !hasModifiedChildren) {
    return obj;
  }

  // This path or its children will be modified - shallow clone this level
  if (Array.isArray(obj)) {
    return obj.map((item, index) => {
      const itemPath = [...currentPath, String(index)];
      return copyOnWriteClone(item, modifiedPaths, itemPath);
    });
  }

  // Object - shallow clone and recursively handle properties
  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propPath = [...currentPath, key];
      cloned[key] = copyOnWriteClone(obj[key], modifiedPaths, propPath);
    }
  }
  return cloned;
};

/**
 * Fallback: Deep clone (used when copy-on-write optimization can't be applied)
 * Preserves Date objects and parses ISO date strings
 */
export const deepClone = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return parseISODate(obj);
  }
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(deepClone);

  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};
