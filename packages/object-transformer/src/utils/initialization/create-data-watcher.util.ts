import type { Ref } from 'vue';
import { watch } from 'vue';
import type { ObjectNodeData, TransformerMode, ObjectTransformerDesk } from '../../types';
import { buildNodeTree } from '../node/node-builder.util';
import { getDataForMode } from '../model/model-mode.util';

export interface DataWatcherContext {
  desk: ObjectTransformerDesk;
  propsData: Ref<any>;
}

/**
 * Create a watcher that rebuilds the tree when props.data changes
 */
export function createDataWatcher(context: DataWatcherContext) {
  return watch(
    () => context.propsData.value,
    (newData) => {
      context.desk.originalData.value = newData;

      // Respect current mode when rebuilding tree
      const currentMode = context.desk.mode.value as TransformerMode;
      const currentTemplateIndex = context.desk.templateIndex.value;
      const dataForTree = getDataForMode(newData, currentMode, currentTemplateIndex);

      context.desk.tree.value = buildNodeTree(
        dataForTree,
        Array.isArray(dataForTree) ? 'Array' : 'Object'
      );
    },
    { deep: true }
  );
}
