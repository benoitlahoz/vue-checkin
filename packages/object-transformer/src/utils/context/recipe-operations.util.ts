import type { Ref, ComputedRef } from 'vue';
import { computed } from 'vue';
import type { ObjectNodeData, Transform, TransformRecipe } from '../../types';
import {
  buildRecipe as buildRecipeUtil,
  applyRecipe as applyRecipeUtil,
  exportRecipe as exportRecipeUtil,
  importRecipe as importRecipeUtil,
  validateRecipeTransforms as validateRecipeTransformsUtil,
} from '../transform/transform-recipe.util';
import { buildNodeTree } from '../node/node-builder.util';

export interface RecipeOperationsContext {
  tree: Ref<ObjectNodeData>;
  originalData: Ref<any>;
  mode: Ref<'object' | 'model'>;
  transforms: Ref<Transform[]>;
  deskRef?: () => any; // Function to get desk reference (avoids circular dependency)
}

export function createRecipeOperationsMethods(context: RecipeOperationsContext) {
  const recipe: ComputedRef<TransformRecipe> = computed(() => {
    return buildRecipeUtil(context.tree.value);
  });

  return {
    recipe,

    buildRecipe() {
      return recipe.value;
    },

    applyRecipe(data: any, recipeToApply: TransformRecipe) {
      const desk = context.deskRef?.();
      return applyRecipeUtil(data, recipeToApply, context.transforms.value, desk);
    },

    exportRecipe() {
      return exportRecipeUtil(recipe.value);
    },

    importRecipe(recipeJson: string) {
      const parsedRecipe = importRecipeUtil(recipeJson);

      // Validate that all required transforms are available
      const missingTransforms = validateRecipeTransformsUtil(
        parsedRecipe,
        context.transforms.value
      );
      if (missingTransforms.length > 0) {
        throw new Error(
          `Missing required transforms: ${missingTransforms.join(', ')}. ` +
            `Please add the corresponding transform components to the ObjectTransformer.`
        );
      }

      // Apply recipe to original data to get transformed data
      const desk = context.deskRef?.();
      const transformedData = applyRecipeUtil(
        context.originalData.value,
        parsedRecipe,
        context.transforms.value,
        desk
      );

      // Update originalData with transformed data (this becomes the new baseline)
      context.originalData.value = transformedData;

      // Rebuild tree from transformed data
      // In model mode, use first array element, otherwise use the full data
      const dataForTree =
        context.mode.value === 'model' && Array.isArray(transformedData)
          ? transformedData[0]
          : transformedData;

      context.tree.value = buildNodeTree(
        dataForTree,
        Array.isArray(dataForTree) ? 'Array' : 'Object'
      );
    },
  };
}
