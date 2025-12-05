/**
 * Recipe Applier - Apply recipe to data
 *
 * Takes a recipe and applies all its operations sequentially to transform data.
 */

import type { Recipe, RecipeValidation } from './types';
import type { Transform } from '../types';
import { applyOperations } from './operations';

/**
 * Apply a recipe to data
 *
 * Composes all operations in the recipe into a single transformation pipeline.
 * For array data with object recipe, applies recipe to each element (template mode).
 *
 * @param data - Input data to transform
 * @param recipe - Recipe containing operations to apply
 * @param transforms - Available transform functions
 * @returns Transformed data
 */
export const applyRecipe = (data: any, recipe: Recipe, transforms: Transform[]): any => {
  // Build transform index for fast lookup
  const transformsMap = new Map(transforms.map((t) => [t.name, t]));

  // Handle template mode: array data with object recipe
  if (Array.isArray(data) && recipe.metadata?.rootType === 'object') {
    // Apply recipe to each array element
    return data.map((item) => applyOperations(item, recipe.operations, transformsMap));
  }

  // Handle array recipe with array data
  if (Array.isArray(data) && recipe.metadata?.rootType === 'array') {
    // Apply recipe to each element
    return data.map((item) => applyOperations(item, recipe.operations, transformsMap));
  }

  // Single object mode
  return applyOperations(data, recipe.operations, transformsMap);
};

/**
 * Validate a recipe against available transforms
 *
 * Checks:
 * - All required transforms are available
 * - Recipe structure is valid
 * - Operations are well-formed
 *
 * @param recipe - Recipe to validate
 * @param transforms - Available transforms
 * @returns Validation result with errors and warnings
 */
export const validateRecipe = (recipe: Recipe, transforms: Transform[]): RecipeValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingTransforms: string[] = [];

  // Check basic structure
  if (!recipe.version) {
    errors.push('Recipe missing version');
  }

  if (!Array.isArray(recipe.operations)) {
    errors.push('Recipe operations must be an array');
    return { valid: false, errors, warnings, missingTransforms };
  }

  // Check required transforms
  if (recipe.metadata?.requiredTransforms) {
    const availableNames = new Set(transforms.map((t) => t.name));

    recipe.metadata.requiredTransforms.forEach((name) => {
      if (!availableNames.has(name)) {
        missingTransforms.push(name);
      }
    });

    if (missingTransforms.length > 0) {
      errors.push(
        `Missing required transforms: ${missingTransforms.join(', ')}. ` +
          `Please register these transforms before applying the recipe.`
      );
    }
  }

  // Validate each operation
  recipe.operations.forEach((op, index) => {
    if (!op.type) {
      errors.push(`Operation at index ${index} missing type`);
      return;
    }

    switch (op.type) {
      case 'transform':
        if (!op.transformName) {
          errors.push(`Transform operation at index ${index} missing transformName`);
        }
        if (!Array.isArray(op.path)) {
          errors.push(`Transform operation at index ${index} has invalid path`);
        }
        break;

      case 'rename':
        if (!op.from || !op.to) {
          errors.push(`Rename operation at index ${index} missing from/to`);
        }
        if (!Array.isArray(op.path)) {
          errors.push(`Rename operation at index ${index} has invalid path`);
        }
        break;

      case 'delete':
        if (!Array.isArray(op.path)) {
          errors.push(`Delete operation at index ${index} has invalid path`);
        }
        break;

      case 'add':
        if (!op.key) {
          errors.push(`Add operation at index ${index} missing key`);
        }
        if (!Array.isArray(op.path)) {
          errors.push(`Add operation at index ${index} has invalid path`);
        }
        break;

      default:
        warnings.push(`Unknown operation type at index ${index}: ${(op as any).type}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingTransforms,
  };
};
