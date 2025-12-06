import type { ObjectNodeData, NodeKeyMetadata } from '../../types';

/**
 * 🟡 OPTIMIZATION: Centralized key metadata utilities
 * This replaces the scattered logic across originalKey, firstKey, keyModified
 */

/**
 * Get or create key metadata for a node
 */
export const getKeyMetadata = (node: ObjectNodeData): NodeKeyMetadata => {
  if (!node.keyMetadata) {
    node.keyMetadata = {};
  }
  return node.keyMetadata;
};

/**
 * Initialize key metadata when a node is created
 */
export const initKeyMetadata = (node: ObjectNodeData, initialKey?: string): void => {
  node.keyMetadata = {
    original: initialKey || node.key,
    modified: false,
    autoRenamed: false,
  };
};

/**
 * Mark a key as manually modified by the user
 */
export const markKeyAsModified = (node: ObjectNodeData): void => {
  const metadata = getKeyMetadata(node);
  metadata.modified = true;
  metadata.autoRenamed = false; // User override clears auto-rename flag
};

/**
 * Mark a key as auto-renamed (to avoid conflicts)
 */
export const markKeyAsAutoRenamed = (node: ObjectNodeData, originalKey: string): void => {
  const metadata = getKeyMetadata(node);
  metadata.original = originalKey;
  metadata.autoRenamed = true;
  metadata.modified = false; // Auto-rename is not user modification
};

/**
 * Get the original key (for recipe building)
 */
export const getOriginalKey = (node: ObjectNodeData): string | undefined => {
  return node.keyMetadata?.original || node.key;
};

/**
 * Check if key was manually modified by user
 */
export const isKeyModified = (node: ObjectNodeData): boolean => {
  return node.keyMetadata?.modified || false;
};

/**
 * Check if key was auto-renamed
 */
export const isKeyAutoRenamed = (node: ObjectNodeData): boolean => {
  return node.keyMetadata?.autoRenamed || false;
};

/**
 * Get the key to use for deletion in recipe
 * - If user renamed: use current key
 * - If auto-renamed: use original key
 * - Otherwise: use original key
 */
export const getKeyForDeletion = (node: ObjectNodeData): string | undefined => {
  const metadata = node.keyMetadata;
  if (!metadata) return node.key;

  if (metadata.modified && !metadata.autoRenamed) {
    return node.key; // User renamed, use current
  }
  return metadata.original || node.key; // Auto-renamed or default, use original
};

/**
 * Update original key (when parent is renamed)
 */
export const updateOriginalKey = (node: ObjectNodeData, newOriginal: string): void => {
  const metadata = getKeyMetadata(node);
  metadata.original = newOriginal;
};

/**
 * MIGRATION HELPERS: Support old property names during transition
 */
