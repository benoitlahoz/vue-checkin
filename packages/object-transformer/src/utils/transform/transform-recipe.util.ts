import type {
  ObjectNodeData,
  ObjectTransformerContext,
  Transform,
  TransformRecipe,
  TransformStep,
} from '../../types';
import { CURRENT_RECIPE_VERSION } from '../../types';
import { getStructuralTransformHandler } from './structural-transform-handlers.util';

/**
 * Build a recipe from the current tree state
 */
export const buildRecipe = (tree: ObjectNodeData): TransformRecipe => {
  const steps: TransformStep[] = [];
  const deletedPaths: string[][] = [];
  const renamedKeys: Array<{
    path: string[];
    oldKey: string;
    newKey: string;
    isStructuralResult?: boolean;
  }> = [];

  const traverse = (
    node: ObjectNodeData,
    originalPath: string[] = [], // Path using ORIGINAL keys (before any renames)
    isRoot: boolean = true,
    parentIsArrayRoot: boolean = false, // True if parent is the root array
    ancestorIsStructural: boolean = false // True if any ancestor is a structural node
  ) => {
    // Build path - skip root node key (Object/Array), include all others
    // For structural nodes (created by transforms): use firstKey (key at creation)
    // For source nodes (from original data): use originalKey || key
    const isStructuralNode = !!node.splitSourceId;
    const originalKeyToUse = isStructuralNode
      ? node.firstKey || node.key // Structural node: use firstKey
      : node.originalKey || node.key; // Source node: use originalKey

    // For array items, skip numeric indices in paths (they're templates)
    const shouldSkipInPath = parentIsArrayRoot && /^\d+$/.test(originalKeyToUse || '');

    const currentOriginalPath =
      !isRoot && originalKeyToUse && !shouldSkipInPath
        ? [...originalPath, originalKeyToUse]
        : originalPath;

    // Track transformations - use originalPath
    if (node.transforms && node.transforms.length > 0 && originalKeyToUse && !shouldSkipInPath) {
      node.transforms.forEach((transform) => {
        steps.push({
          path: [...originalPath, originalKeyToUse], // Use ORIGINAL key path
          originalType: node.type,
          transformName: transform.name,
          params: transform.params || [],
          structural: isStructuralTransform(transform),
        });
      });
    }

    // Track deleted nodes
    // For deleted nodes:
    // - If the node was renamed (keyModified), use CURRENT key (it was auto-renamed to avoid conflicts)
    // - Otherwise, use ORIGINAL key (the key it had in the source data)
    if (node.deleted && !shouldSkipInPath) {
      const keyToDelete = node.keyModified ? node.key : originalKeyToUse;
      if (keyToDelete) {
        deletedPaths.push([...originalPath, keyToDelete]);
      }
    }

    // Track renamed keys - store parent path using ORIGINAL keys
    // Include deleted nodes that were renamed (they need to be renamed before deletion)
    if (node.keyModified && node.key && !shouldSkipInPath) {
      const oldKey = node.firstKey || node.originalKey;
      if (oldKey && oldKey !== node.key) {
        // A node is a structural result if:
        // 1. It has splitSourceId (it was created by a structural transform), OR
        // 2. Any of its ancestors is structural (it's inside a structural result)
        const isStructuralResult = isStructuralNode || ancestorIsStructural;

        console.log('[buildRecipe] Tracking rename:', {
          path: originalPath,
          oldKey,
          newKey: node.key,
          nodeFirstKey: node.firstKey,
          nodeOriginalKey: node.originalKey,
          splitSourceId: node.splitSourceId,
          isStructuralNode,
          ancestorIsStructural,
          isStructuralResult,
          deleted: node.deleted,
        });

        renamedKeys.push({
          path: originalPath, // Parent path using ORIGINAL keys
          oldKey: oldKey, // Original key (firstKey for structural, originalKey for regular)
          newKey: node.key, // Current key
          isStructuralResult,
        });
      }
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
        // Pass down if this node or any ancestor is structural
        const childAncestorIsStructural = isStructuralNode || ancestorIsStructural;
        traverse(child, currentOriginalPath, false, isArrayRoot, childAncestorIsStructural);
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
  availableTransforms: Transform[],
  desk?: ObjectTransformerContext
): any => {
  // desk should now always be provided via deskRef from context
  if (!desk) {
    console.warn(
      '[ObjectTransformer] applyRecipe called without desk reference. Structural transforms will be skipped.'
    );
  }

  // Clone the data to avoid mutations - preserve Dates
  const result = deepClone(data);

  // If data is an array but recipe is for a single object,
  // apply recipe to each element (template mode)
  if (Array.isArray(result) && recipe.rootType === 'object') {
    return result.map((item) => applySingleRecipe(item, recipe, availableTransforms, desk));
  }

  // If root is an array AND recipe is for an array, apply to each element
  if (recipe.rootType === 'array' && Array.isArray(result)) {
    return result.map((item) => applySingleRecipe(item, recipe, availableTransforms, desk));
  }

  // Otherwise, apply recipe to the single object
  return applySingleRecipe(result, recipe, availableTransforms, desk);
};

/**
 * Apply recipe to a single object (not array root)
 */
const applySingleRecipe = (
  data: any,
  recipe: TransformRecipe,
  availableTransforms: Transform[],
  desk?: ObjectTransformerContext
): any => {
  // Clone the data to avoid mutations - preserve Dates
  const result = deepClone(data);

  // Track applied renames to translate paths from original to current keys
  const pathTranslator: Map<string, string> = new Map(); // Maps "original.path" -> "current.path"

  // Helper to translate a path from original keys to current keys
  const translatePath = (originalPath: string[]): string[] => {
    if (originalPath.length === 0) return [];

    // Build path step by step, checking renames at each level
    const translatedPath: string[] = [];
    for (let i = 0; i < originalPath.length; i++) {
      const partialOriginalPath = originalPath.slice(0, i);
      const originalKey = originalPath[i];

      // Check if this key was renamed
      const pathKey = partialOriginalPath.join('.');
      const renamedKey = pathTranslator.get(`${pathKey}|${originalKey}`);
      translatedPath.push(renamedKey || originalKey);
    }
    return translatedPath;
  };

  // Separate renames by type
  const sourceRenames = recipe.renamedKeys.filter((r) => !r.isStructuralResult);
  const structuralRenames = recipe.renamedKeys.filter((r) => r.isStructuralResult);

  // Apply source renames first (before transforms)
  sourceRenames.sort((a, b) => a.path.length - b.path.length);
  sourceRenames.forEach(({ path, oldKey, newKey }) => {
    const translatedPath = translatePath(path);
    renameKeyAtPath(result, translatedPath, oldKey, newKey);
    // Track this rename for path translation
    pathTranslator.set(`${path.join('.')}|${oldKey}`, newKey);
  });

  // Apply steps using translated paths
  recipe.steps.forEach((step) => {
    // Translate the path from original keys to current keys
    const translatedPath = translatePath(step.path);

    // Find transform that matches both name AND is compatible with the original type
    const mockNode = { type: step.originalType, path: translatedPath };

    const transform = availableTransforms.find((t) => {
      if (t.name !== step.transformName) return false;
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
      applyTransformAtPath(result, translatedPath, transform, step.params, desk);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(
          `Error applying transform "${step.transformName}" at path ${translatedPath.join('.')}:`,
          error
        );
      }
    }
  });

  // Apply deletions using translated paths
  recipe.deletedPaths.forEach((path) => {
    const translatedPath = translatePath(path);
    deleteAtPath(result, translatedPath);
  });

  // Apply structural renames AFTER transforms
  structuralRenames.sort((a, b) => a.path.length - b.path.length);
  structuralRenames.forEach(({ path, oldKey, newKey }) => {
    const translatedPath = translatePath(path);
    renameKeyAtPath(result, translatedPath, oldKey, newKey);
    // Track this rename for subsequent path translations
    pathTranslator.set(`${path.join('.')}|${oldKey}`, newKey);
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
  params: any[],
  desk?: ObjectTransformerContext
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
      const handler = getStructuralTransformHandler(result.action, desk);

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
