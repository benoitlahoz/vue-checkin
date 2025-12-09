import type { Ref } from 'vue';
import type { ObjectNodeData } from '../../types';
import { sanitizeKey, autoRenameKey, findUniqueKey } from '../node/node-utilities.util';
import {
  getOriginalKey,
  markKeyAsModified,
  markKeyAsAutoRenamed,
  getKeyMetadata,
  isKeyModified,
} from '../node/node-key-metadata.util';

export interface KeyEditingContext {
  editingNode: Ref<ObjectNodeData | null>;
  tempKey: Ref<string | null>;
  propagateTransform: (node: ObjectNodeData) => void;
  triggerTreeUpdate: () => void;
  deskRef?: () => any; // Access to desk for recorder
}

export function createKeyEditingMethods(context: KeyEditingContext) {
  return {
    startEditKey(node: ObjectNodeData) {
      context.editingNode.value = node;
      context.tempKey.value = node.key || null;
    },

    confirmEditKey(node: ObjectNodeData) {
      const newKey = context.tempKey.value?.trim();

      if (!newKey || !sanitizeKey(newKey)) {
        context.tempKey.value = node.key || null;
        context.editingNode.value = null;
        return;
      }

      if (newKey === node.key) {
        context.editingNode.value = null;
        return;
      }

      const parent = node.parent;
      if (parent?.type === 'object' && parent.children) {
        // Check if we're restoring to original key
        const isRestoringToOriginal = getOriginalKey(node) === newKey;

        // Find conflicting node (same key but different node)
        // Ignore deleted nodes in conflict detection
        const conflictingNode = parent.children.find(
          (c) => c !== node && c.key === newKey && !c.deleted
        );

        // Also check if there's a deleted node with this key
        // If we're renaming to a deleted node's key, we need to auto-rename the deleted node
        const deletedNodeWithKey = parent.children.find(
          (c) => c !== node && c.key === newKey && c.deleted
        );

        if (conflictingNode && isRestoringToOriginal) {
          // We're restoring to original key - rename the conflicting node instead

          // Store original key of conflicting node BEFORE changing it
          const conflictingMetadata = getKeyMetadata(conflictingNode);
          if (!conflictingMetadata.original) {
            conflictingMetadata.original = conflictingNode.key;
          }

          const existingKeys = new Set(
            parent.children
              .filter((c) => !c.deleted && c !== conflictingNode)
              .map((c) => c.key)
              .filter((k): k is string => Boolean(k))
          );
          const uniqueKey = findUniqueKey(existingKeys, newKey, 1);

          conflictingNode.key = uniqueKey;
          markKeyAsModified(conflictingNode);

          // Restore this node to original key
          node.key = newKey;
          const nodeMetadata = getKeyMetadata(node);

          // We're back to original, so not modified anymore
          // But keep the original value stored for future renames
          nodeMetadata.modified = false;

          // Propagate both nodes to update recipe
          if (conflictingNode.transforms && conflictingNode.transforms.length > 0) {
            context.propagateTransform(conflictingNode);
          }
        } else {
          // Normal rename
          const oldKey = node.key;

          // If there's a deleted node with the target key, auto-rename it first
          if (deletedNodeWithKey) {
            // Store original key of deleted node BEFORE changing it
            const deletedMetadata = getKeyMetadata(deletedNodeWithKey);
            if (!deletedMetadata.original) {
              deletedMetadata.original = deletedNodeWithKey.key;
            }

            // Find a unique key for the deleted node
            // Exclude both the deleted node AND the current node being renamed
            const existingKeys = new Set(
              parent.children
                .filter((c) => !c.deleted && c !== deletedNodeWithKey && c !== node)
                .map((c) => c.key)
                .filter((k): k is string => Boolean(k))
            );
            const uniqueKey = findUniqueKey(existingKeys, newKey, 1);

            deletedNodeWithKey.key = uniqueKey;
            markKeyAsAutoRenamed(deletedNodeWithKey, newKey);

            // DON'T update the delete operation path - it should reference the original key
            // from the source data, not the current UI key
          }

          // Re-check for conflicts after renaming deleted node
          // The deleted node has been moved to a different key, so check if there's still a conflict
          const stillConflicting = parent.children.find(
            (c) => c !== node && c.key === newKey && !c.deleted
          );

          // Use the recalculated conflict check instead of the original conflictingNode
          const finalKey = stillConflicting ? autoRenameKey(parent, newKey) : newKey;

          // Get or initialize metadata
          const nodeMetadata = getKeyMetadata(node);

          // Store original key BEFORE any rename (if not already stored)
          // This is the key from the source data, before user modifications
          if (!nodeMetadata.original) {
            nodeMetadata.original = oldKey;
          }

          node.key = finalKey;
          markKeyAsModified(node);

          // 🟢 RECORD THE RENAME OPERATION (v4.0 Delta with parentOpId support)
          const desk = context.deskRef?.();

          if (desk?.recorder && oldKey && oldKey !== finalKey) {
            // Check if this node is a child of a structural object (e.g., created by To Object)
            // Use parentOpId instead of parentKey for proper nesting support
            const parent = node.parent;
            let parentOpId: string | undefined;

            if (parent && parent.splitSourceId !== undefined) {
              // This parent was created by a structural transform - get its opId
              parentOpId = desk.recorder.getOpIdForNode(parent.id);
            }

            desk.recorder.recordRename(oldKey, finalKey, {
              parentOpId,
              description: `Rename ${oldKey} to ${finalKey}`,
            });
          }

          // IMPORTANT: When renaming a node with children (like name_object -> name),
          // we need to update the originalKey of all descendants so the recipe
          // can track the path changes correctly
          if (node.children && node.children.length > 0) {
            updateDescendantPaths(node, oldKey, finalKey, context.propagateTransform);
          }
        }

        context.tempKey.value = node.key || null;
        context.propagateTransform(parent);
        context.triggerTreeUpdate(); // Trigger reactivity
      }

      context.editingNode.value = null;
    },

    cancelEditKey(node: ObjectNodeData) {
      context.tempKey.value = node.key || null;
      context.editingNode.value = null;
    },
  };
}

// Update paths for all descendants when parent key changes
function updateDescendantPaths(
  parent: ObjectNodeData,
  _oldParentKey: string | undefined,
  _newParentKey: string,
  propagateTransform: (node: ObjectNodeData) => void
) {
  if (!parent.children) return;

  const traverse = (node: ObjectNodeData) => {
    // Note: We don't update originalKey here because buildRecipe uses the current
    // tree structure to compute paths. The parent's key change is already reflected
    // in the tree, so descendants will automatically get the correct path.
    // The parameters are kept for potential future use if we need to track
    // path changes more explicitly.

    // Recursively process children
    if (node.children) {
      node.children.forEach((child) => traverse(child));
    }

    // Propagate transforms to update the recipe with new paths
    if (node.transforms && node.transforms.length > 0) {
      propagateTransform(node);
    }
  };

  parent.children.forEach((child) => traverse(child));
}
