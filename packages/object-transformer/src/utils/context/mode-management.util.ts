import type { Ref } from 'vue';
import type { ObjectNodeData, TransformerMode } from '../../types';
import { buildNodeTree } from '../node/node-builder.util';
import { getDataForMode } from '../model/model-mode.util';
import { extractModelRules as extractModelRulesUtil } from '../model/model-rules.util';

export interface ModeOperationsContext {
  tree: Ref<ObjectNodeData>;
  originalData: Ref<any>;
  mode: Ref<TransformerMode>;
  templateIndex: Ref<number>;
}

export function createModeManagementMethods(context: ModeOperationsContext) {
  return {
    setMode(newMode: TransformerMode) {
      context.mode.value = newMode;

      // Rebuild tree with appropriate data
      const data = getDataForMode(context.originalData.value, newMode, context.templateIndex.value);
      context.tree.value = buildNodeTree(data, Array.isArray(data) ? 'Array' : 'Object');
    },

    setTemplateIndex(index: number) {
      if (!Array.isArray(context.originalData.value)) return;

      context.templateIndex.value = index;

      // Rebuild tree with new template object
      if (context.mode.value === 'model') {
        const data = getDataForMode(context.originalData.value, context.mode.value, index);
        context.tree.value = buildNodeTree(data, 'Object');
      }
    },

    extractModelRules() {
      return extractModelRulesUtil(context.tree.value);
    },

    applyModelToAll() {
      // Just switch to object mode to show the full transformed array
      context.mode.value = 'object';

      // Rebuild tree with appropriate data
      const data = getDataForMode(
        context.originalData.value,
        'object',
        context.templateIndex.value
      );
      context.tree.value = buildNodeTree(data, Array.isArray(data) ? 'Array' : 'Object');
    },
  };
}
