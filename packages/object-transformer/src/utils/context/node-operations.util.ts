import type { Ref } from 'vue';
import { triggerRef } from 'vue';
import type { ObjectNodeData } from '../../types';
import { handleRestoreConflict } from '../node/node-utilities.util';
import { computePathFromNode } from '../../recipe/recipe-recorder';

export interface NodeOperationsContext {
  tree: Ref<ObjectNodeData>;
  propagateTransform: (node: ObjectNodeData) => void;
  deskRef?: () => any;
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

      // 🟢 RECORD THE OPERATION (Delta-based recording)
      const desk = context.deskRef?.();
      if (desk?.recorder && node.parent) {
        const path = computePathFromNode(node, desk.mode?.value);

        if (!wasDeleted && node.deleted) {
          // Node was visible, now deleted → record delete
          desk.recorder.recordDelete(path);
        } else if (wasDeleted && !node.deleted) {
          // Node was deleted, now restored → remove the delete operation from recipe
          desk.recorder.removeDelete(path);
        }
      }

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
