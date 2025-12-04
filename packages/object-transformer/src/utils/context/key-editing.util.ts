import type { Ref } from 'vue';
import type { ObjectNodeData } from '../../types';
import { sanitizeKey, autoRenameKey, findUniqueKey } from '../node/node-utilities.util';

export interface KeyEditingContext {
  editingNode: Ref<ObjectNodeData | null>;
  tempKey: Ref<string | null>;
  propagateTransform: (node: ObjectNodeData) => void;
  triggerTreeUpdate: () => void;
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
        const isRestoringToOriginal = node.originalKey === newKey;

        console.log('[confirmEditKey] Rename attempt:', {
          nodeKey: node.key,
          newKey,
          originalKey: node.originalKey,
          firstKey: node.firstKey,
          isRestoringToOriginal,
        });

        // Find conflicting node (same key but different node)
        // Ignore deleted nodes in conflict detection
        const conflictingNode = parent.children.find(
          (c) => c !== node && c.key === newKey && !c.deleted
        );

        if (conflictingNode) {
          console.log('[confirmEditKey] Found conflicting node:', {
            conflictKey: conflictingNode.key,
            conflictOriginalKey: conflictingNode.originalKey,
            conflictFirstKey: conflictingNode.firstKey,
          });
        }

        // Also check if there's a deleted node with this key
        // If we're renaming to a deleted node's key, we should take over that position
        const deletedNodeWithKey = parent.children.find(
          (c) => c !== node && c.key === newKey && c.deleted
        );

        if (conflictingNode && isRestoringToOriginal) {
          // We're restoring to original key - rename the conflicting node instead

          // Store original key of conflicting node BEFORE changing it
          if (!conflictingNode.originalKey) {
            conflictingNode.originalKey = conflictingNode.key;
          }

          const existingKeys = new Set(
            parent.children
              .filter((c) => !c.deleted && c !== conflictingNode)
              .map((c) => c.key)
              .filter((k): k is string => Boolean(k))
          );
          const uniqueKey = findUniqueKey(existingKeys, newKey, 1);

          conflictingNode.key = uniqueKey;
          conflictingNode.keyModified = true;

          // Restore this node to original key
          node.key = newKey;
          node.keyModified = false; // No longer modified since we're back to original
          node.originalKey = undefined; // Clear original key

          // Propagate both nodes to update recipe
          if (conflictingNode.transforms && conflictingNode.transforms.length > 0) {
            context.propagateTransform(conflictingNode);
          }
        } else {
          // Normal rename - use autoRenameKey to avoid conflicts
          const oldKey = node.key;

          // If there's a deleted node with the target key, we're taking over that key
          // The deleted node will need to be auto-renamed if it's ever restored
          const finalKey = deletedNodeWithKey ? newKey : autoRenameKey(parent, newKey);

          // Store original key before renaming (only if not already stored)
          if (!node.originalKey && oldKey !== finalKey) {
            node.originalKey = oldKey;
          }

          node.key = finalKey;
          node.keyModified = true;

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
