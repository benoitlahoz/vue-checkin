import type {
  ObjectNodeData,
  ObjectTransformerContext,
  Transform,
  TransformRecipe,
  TransformStep,
} from '../../types';
import { CURRENT_RECIPE_VERSION } from '../../types';
import { getStructuralTransformHandler } from './structural-transform-handlers.util';
import {
  getOriginalKeyCompat,
  getFirstKeyCompat,
  isKeyModifiedCompat,
  getKeyForDeletion,
} from '../node/node-key-metadata.util';
import {
  copyOnWriteClone,
  buildModifiedPaths,
  deepClone as deepCloneFallback,
} from './copy-on-write-clone.util';

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
      ? getFirstKeyCompat(node) || node.key // Structural node: use firstKey
      : getOriginalKeyCompat(node) || node.key; // Source node: use originalKey

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
    // - If the node was renamed by the user (keyModified && !autoRenamed), use CURRENT key
    // - If the node was auto-renamed to avoid conflicts (autoRenamed), use ORIGINAL key
    // - Otherwise, use ORIGINAL key (the key it had in the source data)
    if (node.deleted && !shouldSkipInPath) {
      const keyToDelete = getKeyForDeletion(node);
      if (keyToDelete) {
        deletedPaths.push([...originalPath, keyToDelete]);
      }
    }

    // Track renamed keys - store parent path using ORIGINAL keys
    // Skip deleted nodes - they don't need rename tracking in the recipe
    // since they're going to be deleted anyway
    if (isKeyModifiedCompat(node) && node.key && !shouldSkipInPath && !node.deleted) {
      // 🔧 FIX: For structural nodes, use the original key from metadata
      // For regular nodes, use firstKey/originalKey compat
      let oldKey: string | undefined;
      if (isStructuralNode) {
        // For structural nodes created by transforms, use keyMetadata.original
        oldKey = node.keyMetadata?.original || getOriginalKeyCompat(node);
      } else {
        // For regular source nodes, use firstKey or originalKey
        oldKey = getFirstKeyCompat(node) || getOriginalKeyCompat(node);
      }
      
      if (oldKey && oldKey !== node.key) {
        // A node is a structural result if:
        // 1. It has splitSourceId (it was created by a structural transform), OR
        // 2. Any of its ancestors is structural (it's inside a structural result)
        const isStructuralResult = isStructuralNode || ancestorIsStructural;

        renamedKeys.push({
          path: originalPath, // Parent path using ORIGINAL keys
          oldKey: oldKey, // Original key from metadata or compat
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

  // Deduplicate renamedKeys - keep only the last rename for each oldKey + path combination
  // This handles successive renames (e.g., age_object -> age -> foo should only keep age_object -> foo)
  const deduplicatedRenames: typeof renamedKeys = [];
  const renameMap = new Map<string, (typeof renamedKeys)[0]>();

  renamedKeys.forEach((rename) => {
    const key = `${rename.path.join('.')}|${rename.oldKey}`;
    renameMap.set(key, rename); // Last one wins
  });

  renameMap.forEach((rename) => deduplicatedRenames.push(rename));

  const recipe = {
    version: '1.0.0',
    rootType: tree.type,
    steps,
    deletedPaths: uniqueDeletedPaths,
    renamedKeys: deduplicatedRenames,
    requiredTransforms,
    createdAt: new Date().toISOString(),
  };

  return recipe;
};

/**
 * Deep clone that preserves Date objects and parses ISO date strings
 * 🟡 DEPRECATED: Kept for backward compatibility, use copyOnWriteClone for better performance
 */
const deepClone = deepCloneFallback;

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
  // 🟡 OPTIMIZATION: Use copy-on-write cloning for better performance
  // Build set of paths that will be modified
  const modifiedPaths = buildModifiedPaths(
    recipe.steps,
    recipe.deletedPaths,
    recipe.renamedKeys
  );
  
  // Clone only the branches that will be modified
  const result = copyOnWriteClone(data, modifiedPaths);

  // 🟢 OPTIMIZATION: Build transform index once instead of searching for each step
  const transformsByName = new Map<string, Transform[]>();
  for (const transform of availableTransforms) {
    const existing = transformsByName.get(transform.name);
    if (existing) {
      existing.push(transform);
    } else {
      transformsByName.set(transform.name, [transform]);
    }
  }

  // Track applied renames to translate paths from original to current keys
  const pathTranslator: Map<string, string> = new Map(); // Maps "original.path" -> "current.path"

  // 🟢 OPTIMIZATION: Cache translated paths to avoid redundant calculations
  const translatedPathCache = new Map<string, string[]>();

  // Helper to translate a path from original keys to current keys
  const translatePath = (originalPath: string[]): string[] => {
    if (originalPath.length === 0) return [];

    // 🟢 OPTIMIZATION: Check cache first
    const cacheKey = originalPath.join('.');
    const cached = translatedPathCache.get(cacheKey);
    if (cached) return cached;

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

    // 🟢 OPTIMIZATION: Store in cache
    translatedPathCache.set(cacheKey, translatedPath);
    return translatedPath;
  };

  // Separate renames by type
  const sourceRenames = recipe.renamedKeys.filter((r) => !r.isStructuralResult);
  const structuralRenames = recipe.renamedKeys.filter((r) => r.isStructuralResult);

  // 🟡 OPTIMIZATION: Single-pass application combining all operations
  // Group operations by depth for efficient processing
  interface Operation {
    type: 'sourceRename' | 'step' | 'deletion' | 'structuralRename';
    path: string[];
    data?: any;
    depth: number;
  }

  const operations: Operation[] = [];

  // Add source renames (depth-first)
  sourceRenames.forEach(({ path, oldKey, newKey }) => {
    operations.push({
      type: 'sourceRename',
      path,
      data: { oldKey, newKey },
      depth: path.length,
    });
  });

  // Add steps
  recipe.steps.forEach((step) => {
    operations.push({
      type: 'step',
      path: step.path,
      data: step,
      depth: step.path.length,
    });
  });

  // Add deletions
  recipe.deletedPaths.forEach((path) => {
    operations.push({
      type: 'deletion',
      path,
      depth: path.length,
    });
  });

  // Add structural renames (depth-first)
  structuralRenames.forEach(({ path, oldKey, newKey }) => {
    operations.push({
      type: 'structuralRename',
      path,
      data: { oldKey, newKey },
      depth: path.length,
    });
  });

  // Sort operations: source renames → steps → deletions → structural renames
  // Within each type, sort by depth (shallow to deep)
  const typeOrder = {
    sourceRename: 0,
    step: 1,
    deletion: 2,
    structuralRename: 3,
  };

  operations.sort((a, b) => {
    // First by type
    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    // Then by depth
    return a.depth - b.depth;
  });

  // Execute operations in order
  operations.forEach((op) => {
    const translatedPath = translatePath(op.path);

    switch (op.type) {
      case 'sourceRename': {
        const { oldKey, newKey } = op.data;
        renameKeyAtPath(result, translatedPath, oldKey, newKey);
        pathTranslator.set(`${op.path.join('.')}|${oldKey}`, newKey);
        translatedPathCache.clear();
        break;
      }

      case 'step': {
        const step = op.data;
        const candidates = transformsByName.get(step.transformName);
        if (!candidates) {
          if (import.meta.env.DEV) {
            console.warn(
              `Transform "${step.transformName}" not found at path ${op.path.join('.')}`
            );
          }
          break;
        }

        const mockNode = { type: step.originalType, path: translatedPath };
        const transform = candidates.find((t) => {
          if (t.if && !t.if(mockNode as any)) return false;
          return true;
        });

        if (!transform) {
          if (import.meta.env.DEV) {
            console.warn(
              `Transform "${step.transformName}" not found for type "${step.originalType}" at path ${op.path.join('.')}`
            );
          }
          break;
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
        break;
      }

      case 'deletion': {
        deleteAtPath(result, translatedPath);
        break;
      }

      case 'structuralRename': {
        const { oldKey, newKey } = op.data;
        renameKeyAtPath(result, translatedPath, oldKey, newKey);
        pathTranslator.set(`${op.path.join('.')}|${oldKey}`, newKey);
        translatedPathCache.clear();
        break;
      }
    }
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

  // 🟢 OPTIMIZATION: Navigate directly to parent
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
  // 🟢 OPTIMIZATION: Handle root-level rename directly
  if (path.length === 0) {
    if (obj[oldKey] !== undefined) {
      obj[newKey] = obj[oldKey];
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete obj[oldKey];
    }
    return;
  }

  // 🟢 OPTIMIZATION: Navigate directly to target
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

  // 🟢 OPTIMIZATION: Navigate to target in a single pass
  let current = obj;
  
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!segment || current[segment] === undefined) return;
    current = current[segment];
  }

  const lastKey = path[path.length - 1];
  if (!lastKey || current[lastKey] === undefined) return;

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
      const child = current.children.find(
        (c) => c.key === segment || getOriginalKeyCompat(c) === segment
      );
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

    const child = parentNode.children.find(
      (c) => c.key === oldKey || getFirstKeyCompat(c) === oldKey
    );
    if (child) {
      child.key = newKey;
      // 🟡 OPTIMIZATION: Use new metadata structure
      if (!child.keyMetadata) {
        child.keyMetadata = {};
      }
      child.keyMetadata.modified = true;
    }
  });

  return tree;
};
