import { ref, computed, nextTick, type Ref } from 'vue';
import type { ObjectNodeData, Transform } from '../../types';
import { applyRecipe as applyRecipeUtil } from '../../recipe/recipe-applier';
import { buildNodeTree, destroyNodeTree } from '../node/node-builder.util';
import { getDataForMode } from '../model/model-mode.util';

// 🟢 Use delta-based recording (like Quill Delta / Excel Macros)
import { createRecipeRecorder } from '../../recipe/recipe-recorder';
import type { RecipeRecorder } from '../../recipe/recipe-recorder';

export interface RecipeOperationsContext {
  tree: Ref<ObjectNodeData>;
  originalData: Ref<any>;
  mode: Ref<'object' | 'model'>;
  templateIndex: Ref<number>;
  transforms: Ref<Transform[]>;
  treeKey: Ref<number>;
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

  // Store imported recipe separately (when recipe is imported, recorder is cleared)
  const importedRecipe = ref<any>(null);

  return {
    // Expose recorder for direct access
    recorder,

    // Expose imported recipe (null if no import or after manual changes)
    importedRecipe,

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
    async importRecipe(recipeJson: string) {
      const recipe = JSON.parse(recipeJson);

      // Store the imported recipe for later use (e.g., propertyVariations)
      importedRecipe.value = recipe;

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
        recipe,
        context.transforms.value
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
    },

    // Clear recipe
    clearRecipe() {
      recorder.clear();
    },
  };
}
