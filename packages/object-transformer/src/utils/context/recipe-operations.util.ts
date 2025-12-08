import { ref, computed, nextTick, type Ref } from 'vue';
import type { ObjectNodeData, Transform, TransformerError } from '../../types';
import { applyRecipe as applyRecipeUtil } from '../../recipe/delta-applier';
import { buildNodeTree, destroyNodeTree } from '../node/node-builder.util';
import { getDataForMode } from '../model/model-mode.util';

// 🟢 Use delta-based recording v4.0 (inspired by Quill Delta)
import { createRecorder, type DeltaRecorder } from '../../recipe/delta-recorder';
import type { Recipe } from '../../recipe/types-v4';

export interface RecipeOperationsContext {
  tree: Ref<ObjectNodeData>;
  originalData: Ref<any>;
  mode: Ref<'object' | 'model'>;
  templateIndex: Ref<number>;
  transforms: Ref<Transform[]>;
  treeKey: Ref<number>;
  deskRef?: () => any;
  notify: (error: Partial<TransformerError>) => void;
}

/**
 * Create recipe operations methods
 *
 * Uses delta-based recording v4.0: sequential operations like Quill Delta.
 * This is the ONLY reliable way - trying to reconstruct from tree state is unreliable.
 */
export function createRecipeOperationsMethods(context: RecipeOperationsContext) {
  // Compute root type from mode
  const rootType = computed(() => (context.mode.value === 'model' ? 'array' : 'object'));

  // Create recorder
  const recorder: DeltaRecorder = createRecorder(rootType.value);

  // Store imported recipe separately (when recipe is imported, recorder is cleared)
  const importedRecipe = ref<Recipe | null>(null);

  return {
    // Expose recorder for direct access
    recorder,

    // Expose imported recipe (null if no import or after manual changes)
    importedRecipe,

    // Expose recipe (reactive)
    recipe: computed(() => recorder.getRecipe()),

    // Build recipe (for compatibility - just returns current recipe)
    buildRecipe() {
      return recorder.getRecipe();
    },

    // Apply recipe (uses recipe-applier)
    applyRecipe(data: any, recipeToApply: any, sourceData?: any) {
      try {
        return applyRecipeUtil(
          data,
          recipeToApply,
          context.transforms.value,
          sourceData ?? context.originalData.value
        );
      } catch (error) {
        context.notify({
          code: 'RECIPE_APPLY_ERROR',
          message: 'Failed to apply recipe',
          details: error instanceof Error ? error.message : error,
          severity: 'error',
        });
        throw error;
      }
    },

    // Export recipe
    exportRecipe() {
      return recorder.exportRecipe();
    },

    // Import recipe
    async importRecipe(recipeJson: string) {
      try {
        // Import into recorder
        recorder.importRecipe(recipeJson);

        // Store the imported recipe for later use (e.g., propertyVariations)
        importedRecipe.value = recorder.getRecipe();

        // 🟢 DESTRUCTIVE IMPORT PROCESS:
        // 1. Apply recipe to original input data
        // 2. Destroy old tree completely (breaks circular refs)
        // 3. Clear recorder to start fresh
        // 4. Build new tree from transformed data (respecting current mode)
        // 5. Increment treeKey to force Vue component remount
        // 6. Wait for Vue to process the remount
        // 7. Update originalData to keep in sync

        const transformedData = applyRecipeUtil(
          context.originalData.value,
          importedRecipe.value!,
          context.transforms.value,
          context.originalData.value
        );

        // Destroy old tree first - this breaks all circular references
        if (context.tree.value) {
          destroyNodeTree(context.tree.value);
        }

        // Clear recorder - we start fresh with transformed data
        recorder.clear();

        // Respect current mode when rebuilding tree (like data watcher does)
        const currentMode = context.mode.value;
        const currentTemplateIndex = context.templateIndex.value;
        const dataForTree = getDataForMode(transformedData, currentMode, currentTemplateIndex);

        // Build completely new tree
        context.tree.value = buildNodeTree(
          dataForTree,
          Array.isArray(dataForTree) ? 'Array' : 'Object'
        );

        // Increment treeKey to force Vue to completely remount the tree
        // This ensures old ObjectNode components are destroyed before new ones mount
        context.treeKey.value++;

        // Wait for Vue to process the remount
        await nextTick();

        // Update originalData to keep in sync
        context.originalData.value = transformedData;
      } catch (error) {
        context.notify({
          code: 'RECIPE_IMPORT_ERROR',
          message: 'Failed to import recipe',
          details: error instanceof Error ? error.message : error,
          severity: 'error',
        });
        throw error;
      }
    },

    // Clear recipe
    clearRecipe() {
      recorder.clear();
    },
  };
}
