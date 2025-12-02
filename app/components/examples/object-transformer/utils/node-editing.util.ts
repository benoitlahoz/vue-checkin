import type { ObjectNodeData } from '..';

/**
 * Click outside handling - Pure functions
 */

export const createClickOutsideChecker = (
  inputElement: HTMLElement | null,
  buttonElement: HTMLElement | null
) => {
  return (event: MouseEvent): boolean => {
    const target = event.target as Node;
    const clickedInput = inputElement?.contains(target);
    const clickedButton = buttonElement?.contains(target);
    return !clickedInput && !clickedButton;
  };
};

/**
 * Key editing state helpers
 */

export const shouldStartEdit = (
  node: ObjectNodeData,
  editingNode: ObjectNodeData | null
): boolean => {
  return editingNode === null;
};

export const canConfirmEdit = (
  tempKey: string | null,
  originalKey: string | undefined
): boolean => {
  return Boolean(tempKey?.trim()) && tempKey?.trim() !== originalKey;
};
