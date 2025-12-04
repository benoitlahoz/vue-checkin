import type { Ref } from 'vue';
import { triggerRef } from 'vue';
import type { ObjectNodeData } from '../../types';
import { handleRestoreConflict } from '../node/node-utilities.util';

export interface NodeOperationsContext {
  tree: Ref<ObjectNodeData>;
  propagateTransform: (node: ObjectNodeData) => void;
}

export function createNodeOperationsMethods(context: NodeOperationsContext) {
  return {
    getNode(id: string): ObjectNodeData | null {
      // Recursive search in the tree
      const findNode = (node: ObjectNodeData): ObjectNodeData | null => {
        if (node.id === id) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNode(child);
            if (found) return found;
          }
        }
        return null;
      };
      return findNode(context.tree.value);
    },

    triggerTreeUpdate() {
      triggerRef(context.tree);
    },

    toggleNodeDeletion(node: ObjectNodeData) {
      const wasDeleted = node.deleted;
      node.deleted = !node.deleted;

      // If restoring a node, check for conflicts with added properties
      if (wasDeleted && !node.deleted && node.parent) {
        handleRestoreConflict(node.parent, node);
      }

      if (node.parent) {
        context.propagateTransform(node.parent);
      }

      triggerRef(context.tree); // Trigger reactivity
    },
  };
}
