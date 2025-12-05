/**
 * Recipe Recorder - Delta-based operation recording
 *
 * Like Quill Delta, Excel Macros, or Git: we record operations AS THEY HAPPEN.
 * This is the ONLY reliable way to capture user intent.
 *
 * The tree is the source of truth for CURRENT STATE.
 * The recorder is the source of truth for HISTORY/CHANGES.
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue';
import type { Operation, Recipe, RecipeMetadata, Path } from './types';
import { RECIPE_VERSION } from './types';

export interface RecipeRecorder {
  /**
   * Current list of recorded operations (reactive)
   */
  operations: Ref<Operation[]>;

  /**
   * Record a transform operation
   * @deprecated Use recordSetTransforms instead
   */
  recordTransform(path: Path, transformName: string, params: any[]): void;

  /**
   * Record the complete transform state for a node
   * This replaces any previous transforms at this path
   */
  recordSetTransforms(path: Path, transforms: Array<{ name: string; params: any[] }>): void;

  /**
   * Record a rename operation
   */
  recordRename(parentPath: Path, from: string, to: string): void;

  /**
   * Record a delete operation
   */
  recordDelete(path: Path): void;

  /**
   * Record an add operation
   */
  recordAdd(parentPath: Path, key: string, value: any): void;

  /**
   * Record an update operation (value change)
   */
  recordUpdate(path: Path, value: any): void;

  /**
   * Clear all recorded operations
   */
  clear(): void;

  /**
   * Build a recipe from recorded operations
   */
  build(requiredTransforms: string[], rootType: 'object' | 'array'): Recipe;

  /**
   * Get recipe as reactive computed
   */
  recipe: ComputedRef<Recipe>;

  /**
   * Get current operation count
   */
  count(): number;
}

/**
 * Create a recipe recorder
 *
 * This is the PRIMARY way to build recipes.
 * It records operations as they happen, ensuring perfect accuracy.
 */
export const createRecipeRecorder = (
  requiredTransforms: Ref<string[]>,
  rootType: Ref<'object' | 'array'>
): RecipeRecorder => {
  const operations = ref<Operation[]>([]);

  // Reactive recipe that updates when operations change
  const recipe = computed<Recipe>(() => {
    // Compute required transforms from actual recorded operations
    const transforms = new Set<string>();
    operations.value.forEach((op) => {
      if (op.type === 'transform') {
        transforms.add(op.transformName);
      } else if (op.type === 'setTransforms') {
        op.transforms.forEach((t) => transforms.add(t.name));
      }
    });

    const metadata: RecipeMetadata = {
      createdAt: new Date().toISOString(),
      requiredTransforms: Array.from(transforms),
      rootType: rootType.value,
    };

    return {
      version: RECIPE_VERSION,
      operations: [...operations.value],
      metadata,
    };
  });

  return {
    operations,
    recipe,

    recordTransform(path: Path, transformName: string, params: any[]) {
      operations.value.push({
        type: 'transform',
        path: [...path],
        transformName,
        params: [...params],
      });
    },

    recordSetTransforms(path: Path, transforms: Array<{ name: string; params: any[] }>) {
      // Remove any previous setTransforms operations for this path
      const pathKey = path.join('.');
      operations.value = operations.value.filter((op) => {
        if (op.type !== 'setTransforms') return true;
        return op.path.join('.') !== pathKey;
      });

      // Only add new operation if there are transforms
      // If transforms is empty, we just removed the operation above (restoration to original)
      if (transforms.length > 0) {
        operations.value.push({
          type: 'setTransforms',
          path: [...path],
          transforms: transforms.map((t) => ({
            name: t.name,
            params: [...t.params],
          })),
        });
      }
    },

    recordRename(parentPath: Path, from: string, to: string) {
      operations.value.push({
        type: 'rename',
        path: [...parentPath],
        from,
        to,
      });
    },

    recordDelete(path: Path) {
      operations.value.push({
        type: 'delete',
        path: [...path],
      });
    },

    recordAdd(parentPath: Path, key: string, value: any) {
      operations.value.push({
        type: 'add',
        path: [...parentPath],
        key,
        value,
      });
    },

    recordUpdate(path: Path, value: any) {
      // Remove any previous update operations for this exact path
      const pathKey = path.join('.');
      operations.value = operations.value.filter((op) => {
        if (op.type !== 'update') return true;
        return op.path.join('.') !== pathKey;
      });

      // Add new update operation
      operations.value.push({
        type: 'update',
        path: [...path],
        value,
      });
    },

    clear() {
      operations.value = [];
    },

    build(requiredTransforms: string[], rootType: 'object' | 'array'): Recipe {
      const metadata: RecipeMetadata = {
        createdAt: new Date().toISOString(),
        requiredTransforms,
        rootType,
      };

      return {
        version: RECIPE_VERSION,
        operations: [...operations.value],
        metadata,
      };
    },

    count() {
      return operations.value.length;
    },
  };
};

/**
 * Helper: Compute path from tree node
 *
 * Walks up the tree to build the full path from root to node
 * @param node - The node to compute path for
 * @param mode - Optional mode ('object' | 'model'). In model mode, skips numeric indices for template root.
 */
export const computePathFromNode = (node: any, mode?: 'object' | 'model'): Path => {
  const path: string[] = [];
  let current = node;

  // First pass: compute depth from root and collect ancestors
  const ancestors: any[] = [];
  let temp = node;
  while (temp && temp.parent) {
    ancestors.unshift(temp);
    if (!temp.parent.parent && (temp.parent.key === 'Object' || temp.parent.key === 'Array')) {
      break;
    }
    temp = temp.parent;
  }

  // Second pass: build path
  let currentDepth = 0;
  while (current && current.parent) {
    // In model mode, skip numeric indices ONLY if parent is the root Array (template mode)
    const parentIsRoot = !current.parent.parent && current.parent.key === 'Array';
    const isTemplateRootChild = mode === 'model' && parentIsRoot && /^\d+$/.test(current.key);

    if (current.key && !isTemplateRootChild) {
      path.unshift(current.key);
    }

    // Stop at root node (parent is Object/Array with no grandparent)
    if (
      !current.parent.parent &&
      (current.parent.key === 'Object' || current.parent.key === 'Array')
    ) {
      break;
    }

    current = current.parent;
    currentDepth++;
  }

  return path;
};
