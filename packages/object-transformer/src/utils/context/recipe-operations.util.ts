import { ref, computed, type Ref } from 'vue';
import type { ObjectNodeData, Transform } from '../../types';
import { applyRecipe as applyRecipeUtil } from '../../recipe/recipe-applier';

// 🟢 Use delta-based recording (like Quill Delta / Excel Macros)
import { createRecipeRecorder } from '../../recipe/recipe-recorder';
import type { RecipeRecorder } from '../../recipe/recipe-recorder';

export interface RecipeOperationsContext {
  tree: Ref<ObjectNodeData>;
  originalData: Ref<any>;
  mode: Ref<'object' | 'model'>;
  transforms: Ref<Transform[]>;
  deskRef?: () => any;
}

/**
 * Create recipe operations methods
 *
 * Uses delta-based recording: operations are captured as they happen.
 * This is the ONLY reliable way - trying to reconstruct from tree state is unreliable.
 */
export function createRecipeOperationsMethods(context: RecipeOperationsContext) {
  // Compute required transforms from tree
  const requiredTransforms = computed(() => {
    const transforms = new Set<string>();
    const collectTransforms = (node: ObjectNodeData) => {
      if (node.transforms) {
        node.transforms.forEach((t) => transforms.add(t.name));
      }
      if (node.children) {
        node.children.forEach(collectTransforms);
      }
    };
    collectTransforms(context.tree.value);
    return Array.from(transforms);
  });

  // Compute root type from mode
  const rootType = computed(() => (context.mode.value === 'model' ? 'array' : 'object'));

  // Create recorder
  const recorder: RecipeRecorder = createRecipeRecorder(requiredTransforms, rootType);

  return {
    // Expose recorder for direct access
    recorder,

    // Expose recipe (reactive)
    recipe: recorder.recipe,

    // Build recipe (for compatibility)
    buildRecipe() {
      return recorder.recipe.value;
    },

    // Apply recipe (uses recipe-applier)
    applyRecipe(data: any, recipeToApply: any) {
      return applyRecipeUtil(data, recipeToApply, context.transforms.value);
    },

    // Export recipe
    exportRecipe() {
      return JSON.stringify(recorder.recipe.value, null, 2);
    },

    // Import recipe
    importRecipe(recipeJson: string) {
      const recipe = JSON.parse(recipeJson);
      recorder.clear();
      recipe.operations.forEach((op: any) => {
        switch (op.type) {
          case 'transform':
            recorder.recordTransform(op.path, op.transformName, op.params);
            break;
          case 'rename':
            recorder.recordRename(op.path, op.from, op.to);
            break;
          case 'delete':
            recorder.recordDelete(op.path);
            break;
          case 'add':
            recorder.recordAdd(op.path, op.key, op.value);
            break;
        }
      });
    },

    // Clear recipe
    clearRecipe() {
      recorder.clear();
    },
  };
}
