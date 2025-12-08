/**
 * Recipe Builder - Extract operations from tree
 *
 * Traverses the ObjectNodeData tree and extracts all operations
 * into a flat, ordered list.
 */

import type { ObjectNodeData } from '../types';
import type { Recipe, RecipeMetadata } from './types-v4';
import { createRecipe } from './types-v4';
import { logger } from '../utils/logger.util';

/**
 * Get the original key of a node (before any renames)
 *
 * For nodes created by structural transforms (split, etc.):
 * - Their "original" key IS their current key (name_0, name_1)
 * - They don't have a pre-existing original because they were created dynamically
 *
 * For regular nodes:
 * - Original key is the key from source data (before user renames)
 *
 * Priority:
 * 1. For split nodes: use current key (they ARE the original)
 * 2. keyMetadata.original (new system)
 * 3. firstKey (legacy)
 * 4. originalKey (legacy) - but NOT for split nodes
 * 5. key (fallback)
 */
const getOriginalKey = (node: ObjectNodeData): string => {
  // For nodes created by structural transforms, their current key IS the original
  if (node.splitSourceId !== undefined) {
    return node.key || '';
  }

  if (node.keyMetadata?.original) {
    return node.keyMetadata.original;
  }
  // Legacy support
  if ((node as any).firstKey) {
    return (node as any).firstKey;
  }
  if ((node as any).originalKey) {
    return (node as any).originalKey;
  }
  return node.key || '';
};

/**
 * Check if a node's key was modified by the user
 */
const isKeyModified = (node: ObjectNodeData): boolean => {
  // New system
  if (node.keyMetadata?.modified) {
    return true;
  }
  // Legacy support
  if ((node as any).keyModified) {
    return true;
  }
  return false;
};

/**
 * Build a recipe from a tree
 *
 * Single-pass traversal that collects all operations in order:
 * 1. Transforms (in application order)
 * 2. Renames (if key was modified)
 * 3. Deletions (if node is deleted)
 *
 * @param tree - The ObjectNodeData tree
 * @returns A Recipe with all operations
 */
export const buildRecipe = (tree: ObjectNodeData): Recipe => {
  const operations: Operation[] = [];
  const requiredTransforms = new Set<string>();

  /**
   * Traverse the tree and collect operations
   *
   * @param node - Current node
   * @param path - Path from root to this node (using original keys)
   * @param isRoot - True if this is the root node
   */
  const traverse = (node: ObjectNodeData, path: Path = [], isRoot = true) => {
    // Build current path
    // Skip root node key ("Object" or "Array")
    // Skip numeric indices in template mode (arrays)
    const shouldSkip = isRoot || (node.key && /^\d+$/.test(node.key));
    const currentPath = shouldSkip ? path : [...path, getOriginalKey(node)];

    // 1. Collect transform operations
    if (node.transforms && node.transforms.length > 0 && !shouldSkip) {
      node.transforms.forEach((transform) => {
        operations.push({
          type: 'transform',
          path: currentPath,
          transformName: transform.name,
          params: transform.params || [],
        });

        // Track required transforms
        requiredTransforms.add(transform.name);
      });
    }

    // 2. Collect rename operation
    if (isKeyModified(node) && !shouldSkip && node.key) {
      const originalKey = getOriginalKey(node);
      if (originalKey !== node.key) {
        logger.debug('[buildRecipe] 🔄 Collecting RENAME:', {
          nodeKey: node.key,
          originalKey,
          path,
          keyMetadata: node.keyMetadata,
          isSplitNode: !!node.splitSourceId,
        });
        operations.push({
          type: 'rename',
          path: path, // Parent path
          from: originalKey,
          to: node.key,
        });
      } else {
        logger.debug('[buildRecipe] ⚠️ Key modified but originalKey === key:', {
          nodeKey: node.key,
          originalKey,
          keyMetadata: node.keyMetadata,
        });
      }
    } else if (!isKeyModified(node) && !shouldSkip && node.key) {
      const originalKey = getOriginalKey(node);
      if (originalKey !== node.key) {
        logger.debug('[buildRecipe] ⚠️ Key changed but NOT marked as modified:', {
          nodeKey: node.key,
          originalKey,
          keyMetadata: node.keyMetadata,
          isSplitNode: !!node.splitSourceId,
        });
      }
    }

    // 3. Collect delete operation
    if (node.deleted && !shouldSkip) {
      operations.push({
        type: 'delete',
        path: currentPath,
      });
    }

    // 4. Recurse through children
    if (node.children) {
      // For root arrays, only process first child (template)
      const childrenToProcess =
        isRoot && node.type === 'array' && node.children.length > 0
          ? [node.children[0]]
          : node.children;

      childrenToProcess.forEach((child) => {
        traverse(child, currentPath, false);
      });
    }
  };

  // Start traversal from root
  traverse(tree);

  // Build metadata
  const metadata: RecipeMetadata = {
    createdAt: new Date().toISOString(),
    requiredTransforms: Array.from(requiredTransforms),
    rootType: tree.type === 'array' ? 'array' : 'object',
  };

  return {
    version: RECIPE_VERSION,
    operations,
    metadata,
  };
};

/**
 * Export recipe to JSON string
 */
export const exportRecipe = (recipe: Recipe): string => {
  return JSON.stringify(recipe, null, 2);
};

/**
 * Import recipe from JSON string
 *
 * Validates version and structure
 */
export const importRecipe = (json: string): Recipe => {
  try {
    const recipe = JSON.parse(json);

    // Validate basic structure
    if (!recipe.version || !Array.isArray(recipe.operations)) {
      throw new Error('Invalid recipe format: missing version or operations');
    }

    // Check version
    if (recipe.version !== RECIPE_VERSION) {
      // TODO: Implement version migration if needed
      if (import.meta.env.DEV) {
        logger.warn(
          `Recipe version mismatch: expected ${RECIPE_VERSION}, got ${recipe.version}. ` +
            `Some features may not work correctly.`
        );
      }
    }

    return recipe;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to import recipe: ${message}`);
  }
};
