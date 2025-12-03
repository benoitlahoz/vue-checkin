import type { ObjectNodeData } from '..';

/**
 * Key editing state helpers
 */

export const shouldStartEdit = (
  node: ObjectNodeData,
  editingNode: ObjectNodeData | null
): boolean => {
  // Don't allow editing if another node is being edited
  if (editingNode !== null) return false;

  // Don't allow editing array indices (children of array nodes)
  if (node.parent?.type === 'array') return false;

  return true;
};

export const canConfirmEdit = (
  tempKey: string | null,
  originalKey: string | undefined
): boolean => {
  return Boolean(tempKey?.trim()) && tempKey?.trim() !== originalKey;
};
