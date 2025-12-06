/**
 * Recipe Reactive - Vue integration
 *
 * Provides reactive recipe computed values and operations
 * that integrate seamlessly with Vue's reactivity system.
 */

import { computed, type ComputedRef, type Ref, readonly } from 'vue';
import type { ObjectNodeData, Transform } from '../types';
import type { Recipe } from './types';
import { buildRecipe, exportRecipe, importRecipe } from './recipe-builder';
import { applyRecipe as applyRecipeUtil, validateRecipe } from './recipe-applier';
import { buildNodeTree } from '../utils/node/node-builder.util';
import { logger } from '../utils/logger.util';

/**
 * Create a reactive recipe system
 *
 * Provides:
 * - Auto-computed recipe (memoized via Vue's computed)
 * - Transform index (rebuilt only when transforms change)
 * - Pure function to apply recipe to data
 * - Export/import utilities
 *
 * @param tree - Reactive reference to the ObjectNodeData tree
 * @param transforms - Reactive reference to available transforms
 * @param originalData - Reactive reference to the original data
 * @param mode - Reactive reference to the current mode
 * @returns Reactive recipe API
 */
export function createReactiveRecipe(
  tree: Ref<ObjectNodeData>,
  transforms: Ref<Transform[]>,
  originalData: Ref<any>,
  mode: Ref<'object' | 'model'>
) {
  /**
   * Auto-computed recipe
   * Memoized by Vue - only recalculates when tree changes
   */
  const recipe: ComputedRef<Recipe> = computed(() => {
    return buildRecipe(tree.value);
  });

  /**
   * Apply recipe to data
   * Pure function wrapper
   */
  const apply = (data: any): any => {
    return applyRecipeUtil(data, recipe.value, transforms.value);
  };

  /**
   * Export recipe to JSON string
   */
  const exportJSON = (): string => {
    return exportRecipe(recipe.value);
  };

  /**
   * Import recipe from JSON string
   *
   * This will:
   * 1. Parse and validate the recipe
   * 2. Check that all required transforms are available
   * 3. Apply the recipe to originalData
   * 4. Update originalData with the result
   * 5. Rebuild the tree from the transformed data
   */
  const importJSON = (json: string): void => {
    const imported = importRecipe(json);

    // Validate recipe
    const validation = validateRecipe(imported, transforms.value);
    if (!validation.valid) {
      throw new Error(`Recipe validation failed:\n${validation.errors.join('\n')}`);
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      logger.warn('Recipe warnings:', validation.warnings);
    }

    // Apply recipe to original data
    const transformedData = applyRecipeUtil(originalData.value, imported, transforms.value);

    // Update original data with transformed result
    originalData.value = transformedData;

    // Rebuild tree from transformed data
    const dataForTree =
      mode.value === 'model' && Array.isArray(transformedData)
        ? transformedData[0]
        : transformedData;

    tree.value = buildNodeTree(dataForTree, Array.isArray(dataForTree) ? 'Array' : 'Object');
  };

  return {
    // Readonly recipe (computed)
    recipe: readonly(recipe),

    // Operations
    apply,
    exportJSON,
    importJSON,

    // Utilities
    validate: (recipeToValidate: Recipe) => validateRecipe(recipeToValidate, transforms.value),
  };
}
