import type { Ref } from 'vue';
import { watch, nextTick } from 'vue';
import type { TransformerMode, ObjectTransformerDesk } from '../../types';
import { buildNodeTree, destroyNodeTree } from '../node/node-builder.util';
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
    async (newData) => {
      // 1. Destroy old tree first to break circular references
      if (context.desk.tree.value) {
        destroyNodeTree(context.desk.tree.value);
      }

      // 2. Update originalData
      context.desk.originalData.value = newData;

      // 3. Respect current mode when rebuilding tree
      const currentMode = context.desk.mode.value as TransformerMode;
      const currentTemplateIndex = context.desk.templateIndex.value;
      const dataForTree = getDataForMode(newData, currentMode, currentTemplateIndex);

      // 4. Build completely new tree
      context.desk.tree.value = buildNodeTree(
        dataForTree,
        Array.isArray(dataForTree) ? 'Array' : 'Object'
      );

      // 5. Increment treeKey to force complete remount
      context.desk.treeKey.value++;

      // 6. Wait for Vue to process the remount
      await nextTick();
    },
    { deep: true }
  );
}
