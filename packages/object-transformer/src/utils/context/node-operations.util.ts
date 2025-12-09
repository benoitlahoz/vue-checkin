import type { Ref } from 'vue';
import { triggerRef } from 'vue';
import type { ObjectNodeData } from '../../types';
import { handleRestoreConflict } from '../node/node-utilities.util';
import { getKeyMetadata, getOriginalKey } from '../node/node-key-metadata.util';

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

      // 🟢 RECORD THE OPERATION (Delta-based recording v4.0 with parent support)
      const desk = context.deskRef?.();
      if (desk?.recorder && node.key) {
        // Check if this node is inside a structural object (created by To Object, Split, etc.)
        let parentOpId: string | undefined;
        if (node.parent && node.parent.splitSourceId !== undefined) {
          // The parent was created by a structural transform - get its opId
          parentOpId = desk.recorder.getOpIdForNode(node.parent.id);
        }

        if (!wasDeleted && node.deleted) {
          // Node was visible, now deleted → record delete with current key
          desk.recorder.recordDelete(node.key, {
            parentOpId,
            description: `Delete property ${node.key}`,
          });
        } else if (wasDeleted && !node.deleted) {
          // Node was deleted, now restored → record insert with current key
          // Use sourceKey to map back to original data
          const sourceKey = getOriginalKey(node);

          desk.recorder.recordInsert(node.key, node.value, {
            parentOpId,
            sourceKey,
            description: `Restore property ${node.key} (originally ${sourceKey})`,
          });

          // Check for conflicts with existing properties
          if (node.parent) {
            handleRestoreConflict(node.parent, node, desk.recorder);
          }
        }
      }

      if (node.parent) {
        context.propagateTransform(node.parent);
      }

      triggerRef(context.tree); // Trigger reactivity
    },
  };
}
