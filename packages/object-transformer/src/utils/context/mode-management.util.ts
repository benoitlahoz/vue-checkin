import type { Ref } from 'vue';
import { nextTick } from 'vue';
import type { ObjectNodeData, TransformerMode } from '../../types';
import { buildNodeTree, destroyNodeTree } from '../node/node-builder.util';
import { getDataForMode } from '../model/model-mode.util';
import { extractModelRules as extractModelRulesUtil } from '../model/model-rules.util';

export interface ModeOperationsContext {
  tree: Ref<ObjectNodeData>;
  originalData: Ref<any>;
  mode: Ref<TransformerMode>;
  templateIndex: Ref<number>;
  treeKey: Ref<number>;
}

export function createModeManagementMethods(context: ModeOperationsContext) {
  return {
    async setMode(newMode: TransformerMode) {
      context.mode.value = newMode;

      // Destroy old tree first - this breaks all circular references
      if (context.tree.value) {
        destroyNodeTree(context.tree.value);
      }

      // Rebuild tree with appropriate data
      const data = getDataForMode(context.originalData.value, newMode, context.templateIndex.value);
      context.tree.value = buildNodeTree(data, Array.isArray(data) ? 'Array' : 'Object');

      // Increment treeKey to force Vue component remount
      context.treeKey.value++;

      // Wait for Vue to process the remount
      await nextTick();
    },

    async setTemplateIndex(index: number) {
      if (!Array.isArray(context.originalData.value)) return;

      context.templateIndex.value = index;

      // Rebuild tree with new template object
      if (context.mode.value === 'model') {
        // Destroy old tree first
        if (context.tree.value) {
          destroyNodeTree(context.tree.value);
        }

        const data = getDataForMode(context.originalData.value, context.mode.value, index);
        context.tree.value = buildNodeTree(data, 'Object');

        // Increment treeKey to force Vue component remount
        context.treeKey.value++;

        // Wait for Vue to process the remount
        await nextTick();
      }
    },

    extractModelRules() {
      return extractModelRulesUtil(context.tree.value);
    },

    async applyModelToAll() {
      // Just switch to object mode to show the full transformed array
      context.mode.value = 'object';

      // Destroy old tree first
      if (context.tree.value) {
        destroyNodeTree(context.tree.value);
      }

      // Rebuild tree with appropriate data
      const data = getDataForMode(
        context.originalData.value,
        'object',
        context.templateIndex.value
      );
      context.tree.value = buildNodeTree(data, Array.isArray(data) ? 'Array' : 'Object');

      // Increment treeKey to force Vue component remount
      context.treeKey.value++;

      // Wait for Vue to process the remount
      await nextTick();
    },
  };
}
