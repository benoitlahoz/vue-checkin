import type { ObjectNodeData, ObjectNodeType, Transform } from '..';
import { CURRENT_RECIPE_VERSION } from '..';
import { getStructuralTransformHandler } from './structural-transform-handlers.util';

/**
 * Transform Recipe - A serializable representation of transformations
 */

export interface TransformRecipe {
  version: string;
  rootType: ObjectNodeType;
  steps: TransformStep[];
  deletedPaths: string[][];
  renamedKeys: Array<{ path: string[]; oldKey: string; newKey: string }>;
  requiredTransforms: string[]; // List of transform names required for this recipe
  createdAt?: string; // ISO timestamp of recipe creation
}

export interface TransformStep {
  path: string[]; // Path to the node, e.g., ['user', 'name']
  originalType: ObjectNodeType;
  transformName: string;
  params: any[];
  structural?: boolean;
}

/**
 * Build a recipe from the current tree state
 */
export const buildRecipe = (tree: ObjectNodeData): TransformRecipe => {
  const steps: TransformStep[] = [];
  const deletedPaths: string[][] = [];
  const renamedKeys: Array<{ path: string[]; oldKey: string; newKey: string }> = [];

  const traverse = (
    node: ObjectNodeData,
    originalPath: string[] = [], // Path using originalKey (for transforms/deletions)
    renamePath: string[] = [], // Path using current key (for renames)
    isRoot: boolean = true,
    parentIsArrayRoot: boolean = false // True if parent is the root array
  ) => {
    // Build paths - skip root node key (Object/Array), include all others
    const originalKeyToUse = node.originalKey || node.key;
    const currentKeyToUse = node.key;

    // For array items, skip numeric indices in paths (they're templates)
    const shouldSkipInPath = parentIsArrayRoot && /^\d+$/.test(originalKeyToUse || '');

    const currentOriginalPath =
      !isRoot && originalKeyToUse && !shouldSkipInPath
        ? [...originalPath, originalKeyToUse]
        : originalPath;
    const currentRenamePath =
      !isRoot && currentKeyToUse && !shouldSkipInPath
        ? [...renamePath, currentKeyToUse]
        : renamePath;

    // Track transformations - use originalPath to reference source data
    if (node.transforms && node.transforms.length > 0 && originalKeyToUse && !shouldSkipInPath) {
      node.transforms.forEach((transform) => {
        steps.push({
          path: [...originalPath, originalKeyToUse], // Use original key path
          originalType: node.type,
          transformName: transform.name,
          params: transform.params || [],
          structural: isStructuralTransform(transform),
        });
      });
    }

    // Track deleted nodes - use originalPath
    if (node.deleted) {
      const hasActiveChildren = node.children && node.children.some((child) => !child.deleted);

      if (originalKeyToUse && !hasActiveChildren && !shouldSkipInPath) {
        deletedPaths.push([...originalPath, originalKeyToUse]);
      }
    }

    // Track renamed keys - use renamePath (reflects current renamed structure)
    if (
      node.keyModified &&
      node.key &&
      node.firstKey &&
      node.firstKey !== node.key &&
      !shouldSkipInPath
    ) {
      renamedKeys.push({
        path: renamePath, // Parent path using CURRENT keys (after renames)
        oldKey: node.firstKey, // The original key at creation time
        newKey: node.key, // The custom key
      });
    }

    // Recurse through children
    if (node.children) {
      // For root array, only process first child as template
      const childrenToProcess =
        isRoot && node.type === 'array' && node.children.length > 0
          ? [node.children[0]!]
          : node.children;

      const isArrayRoot = isRoot && node.type === 'array';

      childrenToProcess.forEach((child) => {
        traverse(child, currentOriginalPath, currentRenamePath, false, isArrayRoot);
      });
    }
  };

  traverse(tree);

  // Extract unique transform names required
  const requiredTransforms = Array.from(new Set(steps.map((s) => s.transformName)));

  // Deduplicate deletedPaths (same path might be recorded multiple times)
  const uniqueDeletedPaths = Array.from(new Set(deletedPaths.map((p) => JSON.stringify(p)))).map(
    (p) => JSON.parse(p)
  );

  const recipe = {
    version: '1.0.0',
    rootType: tree.type,
    steps,
    deletedPaths: uniqueDeletedPaths,
    renamedKeys,
    requiredTransforms,
    createdAt: new Date().toISOString(),
  };

  return recipe;
};

/**
 * Deep clone that preserves Date objects and parses ISO date strings
 */
const deepClone = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    // Try to parse ISO date strings into Date objects
    if (typeof obj === 'string') {
      // More permissive ISO 8601 date detection
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
      if (isoDateRegex.test(obj)) {
        const parsed = new Date(obj);
        // Check if the parsed date is valid
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    return obj;
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

/**
 * Apply a recipe to new data
 */
export const applyRecipe = (
  data: any,
  recipe: TransformRecipe,
  availableTransforms: Transform[]
): any => {
  // Clone the data to avoid mutations - preserve Dates
  const result = deepClone(data);

  // If data is an array but recipe is for a single object,
  // apply recipe to each element (template mode)
  if (Array.isArray(result) && recipe.rootType === 'object') {
    return result.map((item) => applySingleRecipe(item, recipe, availableTransforms));
  }

  // If root is an array AND recipe is for an array, apply to each element
  if (recipe.rootType === 'array' && Array.isArray(result)) {
    return result.map((item) => applySingleRecipe(item, recipe, availableTransforms));
  }

  // Otherwise, apply recipe to the single object
  return applySingleRecipe(result, recipe, availableTransforms);
};

/**
 * Apply recipe to a single object (not array root)
 */
const applySingleRecipe = (
  data: any,
  recipe: TransformRecipe,
  availableTransforms: Transform[]
): any => {
  // Clone the data to avoid mutations - preserve Dates
  const result = deepClone(data);

  // IMPORTANT: Apply steps in the ORDER they were recorded in the tree
  // This is critical for structural transforms that create new paths:
  // - "To Object" on name creates name_object with child name_object/name
  // - "Split" on name_object/name must be applied AFTER name_object is created
  // The tree traversal records steps in correct dependency order (parent before children)
  recipe.steps.forEach((step) => {
    // Find transform that matches both name AND is compatible with the original type
    // Create a mock node with the original type to test the transform's condition
    const mockNode = { type: step.originalType, path: step.path };

    const transform = availableTransforms.find((t) => {
      if (t.name !== step.transformName) return false;
      // Check if transform's condition accepts this node type
      if (t.if && !t.if(mockNode as any)) return false;
      return true;
    });

    if (!transform) {
      if (import.meta.env.DEV) {
        console.warn(
          `Transform "${step.transformName}" not found for type "${step.originalType}" at path ${step.path.join('.')}`
        );
      }
      return;
    }

    try {
      applyTransformAtPath(result, step.path, transform, step.params);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          `Error applying transform "${step.transformName}" at path ${step.path.join('.')}:`,
          error
        );
      }
      // Continue with other transforms even if one fails
    }
  });

  // Apply deletions AFTER transforms (to delete transformed results if needed)
  recipe.deletedPaths.forEach((path) => {
    deleteAtPath(result, path);
  });

  // Apply key renames AFTER transforms and deletions
  // IMPORTANT: Sort renames by path depth (parents before children)
  // This ensures parent keys are renamed before we try to navigate through them to rename children
  const sortedRenames = [...recipe.renamedKeys].sort((a, b) => a.path.length - b.path.length);

  sortedRenames.forEach(({ path, oldKey, newKey }) => {
    renameKeyAtPath(result, path, oldKey, newKey);
  });

  return result;
};

/**
 * Get the current recipe format version
 */
export const getCurrentRecipeVersion = (): string => CURRENT_RECIPE_VERSION;

/**
 * Recipe migration functions
 * Each migration transforms a recipe from version N to N+1
 */
type RecipeMigration = (recipe: any) => any;

const migrations: Record<string, RecipeMigration> = {
  // Example: Migration from 0.9.0 to 1.0.0 (adds requiredTransforms field)
  // '0.9.0': (recipe) => ({
  //   ...recipe,
  //   version: '1.0.0',
  //   requiredTransforms: Array.from(new Set(recipe.steps.map((s: any) => s.transformName))),
  //   createdAt: new Date().toISOString(),
  // }),
};

/**
 * Migrate a recipe to the current version
 */
const migrateRecipe = (recipe: any): TransformRecipe => {
  let currentRecipe = recipe;
  let version = recipe.version;

  // Apply migrations in sequence until we reach current version
  while (version !== CURRENT_RECIPE_VERSION) {
    const migration = migrations[version];

    if (!migration) {
      throw new Error(
        `Cannot migrate recipe from version ${version} to ${CURRENT_RECIPE_VERSION}. ` +
          `No migration path available.`
      );
    }

    currentRecipe = migration(currentRecipe);
    version = currentRecipe.version;
  }

  return currentRecipe;
};

/**
 * Export recipe to JSON string
 */
export const exportRecipe = (recipe: TransformRecipe): string => {
  return JSON.stringify(recipe, null, 2);
};

/**
 * Import recipe from JSON string with version migration
 */
export const importRecipe = (recipeJson: string): TransformRecipe => {
  try {
    const recipe = JSON.parse(recipeJson);

    // Validate basic structure
    if (!recipe.version || !recipe.rootType || !Array.isArray(recipe.steps)) {
      throw new Error('Invalid recipe format: missing required fields (version, rootType, steps)');
    }

    // Check version compatibility
    if (recipe.version === CURRENT_RECIPE_VERSION) {
      // Validate current version structure
      // Handle legacy recipes that might not have requiredTransforms
      if (!Array.isArray(recipe.requiredTransforms)) {
        console.warn('Recipe missing requiredTransforms field, auto-generating from steps...');
        recipe.requiredTransforms = Array.from(
          new Set(recipe.steps.map((s: any) => s.transformName))
        );
      }
      if (!Array.isArray(recipe.deletedPaths)) {
        recipe.deletedPaths = [];
      }
      if (!Array.isArray(recipe.renamedKeys)) {
        recipe.renamedKeys = [];
      }
      return recipe;
    }

    // Version is different, attempt migration
    if (import.meta.env.DEV) {
      console.log(
        `Migrating recipe from version ${recipe.version} to ${CURRENT_RECIPE_VERSION}...`
      );
    }
    const migratedRecipe = migrateRecipe(recipe);
    if (import.meta.env.DEV) {
      console.log('Migration successful');
    }

    return migratedRecipe;
  } catch (error) {
    throw new Error(
      `Failed to import recipe: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Validate that all required transforms are available
 * Returns missing transform names, or empty array if all are present
 */
export const validateRecipeTransforms = (
  recipe: TransformRecipe,
  availableTransforms: Transform[]
): string[] => {
  const availableNames = new Set(availableTransforms.map((t) => t.name));
  const missing = recipe.requiredTransforms.filter((name) => !availableNames.has(name));
  return missing;
};

/**
 * Helper: Delete a value at a specific path
 */
const deleteAtPath = (obj: any, path: string[]): void => {
  if (path.length === 0) return;

  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!segment || current[segment] === undefined) return;
    current = current[segment];
  }

  const lastKey = path[path.length - 1];
  if (!lastKey) return;

  if (Array.isArray(current)) {
    const index = parseInt(lastKey);
    if (!isNaN(index)) {
      current.splice(index, 1);
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete current[lastKey];
  }
};

/**
 * Helper: Rename a key at a specific path
 */
const renameKeyAtPath = (obj: any, path: string[], oldKey: string, newKey: string): void => {
  if (path.length === 0) {
    if (obj[oldKey] !== undefined) {
      obj[newKey] = obj[oldKey];
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete obj[oldKey];
    }
    return;
  }

  let current = obj;
  for (const segment of path) {
    if (current[segment] === undefined) return;
    current = current[segment];
  }

  if (current[oldKey] !== undefined) {
    current[newKey] = current[oldKey];
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete current[oldKey];
  }
}; /**
 * Apply a transform at a specific path
 * Uses the same logic as the UI: applies transforms sequentially until a structural one
 */
const applyTransformAtPath = (
  obj: any,
  path: string[],
  transform: Transform,
  params: any[]
): void => {
  if (path.length === 0) {
    // Transform at root level
    return;
  }

  let current = obj;
  const parentPath: string[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!segment || current[segment] === undefined) return;
    parentPath.push(segment);
    current = current[segment];
  }

  const lastKey = path[path.length - 1];
  if (!lastKey) return;

  if (current[lastKey] !== undefined) {
    const inputValue = current[lastKey];
    const result = transform.fn(inputValue, ...params);

    // Handle structural transforms using registered handlers (same as UI)
    if (result?.__structuralChange) {
      const handler = getStructuralTransformHandler(result.action);

      if (handler) {
        handler(current, lastKey, result);
      } else {
        console.warn(
          `Structural transform action "${result.action}" not registered. ` +
            `Use registerStructuralTransformHandler to add support for this action.`
        );
      }
    } else {
      // Non-structural transform: simply replace the value (same as UI)
      current[lastKey] = result;
    }
  }
};

/**
 * Helper: Check if a transform is structural
 */
const isStructuralTransform = (transform: Transform): boolean => {
  // Test with a dummy value to see if it returns a structural result
  try {
    const result = transform.fn('test');
    return result?.__structuralChange === true;
  } catch {
    return false;
  }
};

/**
 * Apply recipe to tree structure (for import)
 * This reconstructs the tree with transformations applied
 */
export const applyRecipeToTree = (
  data: any,
  recipe: TransformRecipe,
  availableTransforms: Transform[],
  buildNodeTree: (value: any, key?: string, parent?: any) => ObjectNodeData
): ObjectNodeData => {
  // Start with a fresh tree from original data
  const tree = buildNodeTree(data, Array.isArray(data) ? 'Array' : 'Object');

  // Helper to find node by path
  const findNodeByPath = (root: ObjectNodeData, path: string[]): ObjectNodeData | null => {
    if (path.length === 0) return root;

    let current = root;
    for (const segment of path) {
      if (!current.children) return null;
      const child = current.children.find((c) => c.key === segment || c.originalKey === segment);
      if (!child) return null;
      current = child;
    }
    return current;
  };

  // Apply each step's transform to the tree
  recipe.steps.forEach((step) => {
    const node = findNodeByPath(tree, step.path);
    if (!node) return;

    const transform = availableTransforms.find((t) => t.name === step.transformName);
    if (!transform) return;

    // Add transform to node
    node.transforms.push({
      ...transform,
      params: step.params,
    });
  });

  // Mark deleted nodes
  recipe.deletedPaths.forEach((path) => {
    const node = findNodeByPath(tree, path);
    if (node) {
      node.deleted = true;
    }
  });

  // Apply renamed keys
  recipe.renamedKeys.forEach(({ path, oldKey, newKey }) => {
    const parentNode = path.length === 0 ? tree : findNodeByPath(tree, path);
    if (!parentNode || !parentNode.children) return;

    const child = parentNode.children.find((c) => c.key === oldKey || c.firstKey === oldKey);
    if (child) {
      child.key = newKey;
      child.keyModified = true;
    }
  });

  return tree;
};
