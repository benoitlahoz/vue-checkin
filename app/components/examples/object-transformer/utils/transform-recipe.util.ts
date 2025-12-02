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

  const traverse = (node: ObjectNodeData, path: string[] = [], isRoot: boolean = true) => {
    // Build current path - skip root node key (Object/Array), include all others
    const currentPath = !isRoot && node.key ? [...path, node.key] : path;

    // Track transformations - only for nodes with keys (not root)
    // Important: Capture transforms BEFORE checking deleted status
    if (node.transforms && node.transforms.length > 0 && node.key) {
      console.log('[buildRecipe] Found transforms on node:', node.key, 'transforms:', node.transforms);
      node.transforms.forEach((transform) => {
        steps.push({
          path: [...path, node.key!],
          originalType: node.type,
          transformName: transform.name,
          params: transform.params || [],
          structural: isStructuralTransform(transform),
        });
      });
    }

    // Track deleted nodes
    if (node.deleted) {
      // Only add to deletedPaths if it has a key (not root)
      if (node.key) {
        deletedPaths.push([...path, node.key]);
      }
      // Still process children even if node is deleted
      // This captures transformations on split results before deletion
    }

    // Track renamed keys
    if (node.keyModified && node.key && node.originalKey && node.originalKey !== node.key) {
      renamedKeys.push({
        path: path,
        oldKey: node.originalKey,
        newKey: node.key,
      });
    }

    // Recurse through children - always traverse, even for deleted nodes
    if (node.children) {
      node.children.forEach((child) => {
        // Pass currentPath to all children, they are never root
        traverse(child, currentPath, false);
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

  return {
    version: '1.0.0',
    rootType: tree.type,
    steps,
    deletedPaths: uniqueDeletedPaths,
    renamedKeys,
    requiredTransforms,
    createdAt: new Date().toISOString(),
  };
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

  // Group steps by path to maintain transformation order
  const stepsByPath = new Map<string, TransformStep[]>();
  recipe.steps.forEach((step) => {
    const pathKey = JSON.stringify(step.path);
    if (!stepsByPath.has(pathKey)) {
      stepsByPath.set(pathKey, []);
    }
    stepsByPath.get(pathKey)!.push(step);
  });

  // Apply transformations in order for each path
  // This ensures regular transforms are applied before structural ones
  stepsByPath.forEach((steps) => {
    steps.forEach((step) => {
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
        console.warn(`Transform "${step.transformName}" not found for type "${step.originalType}"`);
        return;
      }

      applyTransformAtPath(result, step.path, transform, step.params);
    });
  });

  // Apply deletions AFTER transforms (to delete transformed results if needed)
  recipe.deletedPaths.forEach((path) => {
    deleteAtPath(result, path);
  });

  // Apply key renames AFTER transforms and deletions
  recipe.renamedKeys.forEach(({ path, oldKey, newKey }) => {
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
    console.log(`Migrating recipe from version ${recipe.version} to ${CURRENT_RECIPE_VERSION}...`);
    const migratedRecipe = migrateRecipe(recipe);
    console.log('Migration successful');

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
 * Helper: Apply a transform at a specific path
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

    // Handle structural transforms
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
