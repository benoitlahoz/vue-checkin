import type { ObjectNodeData, Transform, ObjectTransformerDesk } from '..';

/**
 * Transform filtering - Pure functions
 */ export const filterTransformsByType = (
  transforms: Transform[],
  nodeType: string
): Transform[] => {
  return transforms.filter((t) => t.if({ type: nodeType } as ObjectNodeData));
};

/**
 * Transform actions - Side effects isolated
 */

export const applyNodeTransform = (
  node: ObjectNodeData,
  transformName: string | null,
  desk: ObjectTransformerDesk,
  currentSelection: string | null
): void => {
  if (!transformName || transformName === 'None') {
    node.transforms = [];
    // Cleanup split nodes when removing transform
    if (node.parent) {
      cleanupSplitNodes(node, node.parent);
      desk.propagateTransform(node.parent);
    }
    desk.triggerTreeUpdate(); // Trigger reactivity
    return;
  }

  const shouldAdd = !currentSelection || currentSelection === '+';
  const shouldChange =
    currentSelection && currentSelection !== '+' && currentSelection !== transformName;

  if (!shouldAdd && !shouldChange) {
    return;
  }

  // Cleanup split nodes if changing transform
  if (shouldChange && node.parent) {
    cleanupSplitNodes(node, node.parent);
  }

  const entry = desk.createTransformEntry(transformName, node);
  if (!entry) {
    return;
  }

  if (shouldAdd) {
    node.transforms.push(entry);
  } else {
    node.transforms = [entry];
  }

  desk.propagateTransform(node);
  if (node.parent) desk.propagateTransform(node.parent);
  desk.triggerTreeUpdate(); // Trigger reactivity
};

export const applyStepTransform = (
  node: ObjectNodeData,
  stepIndex: number,
  transformName: string | null,
  desk: ObjectTransformerDesk
): void => {
  if (!transformName) return;

  const nextIndex = stepIndex + 1;

  if (transformName === 'None') {
    // Check if we're removing a structural transform
    const removingStructural = node.transforms
      .slice(nextIndex)
      .some((t, idx) => desk.isStructuralTransform(node, nextIndex + idx));

    node.transforms.splice(nextIndex);

    // Cleanup split nodes if we removed a structural transform
    if (removingStructural && node.parent) {
      cleanupSplitNodes(node, node.parent);
    }
  } else {
    // Check if there's already a transform at nextIndex (we're replacing)
    const isReplacing = nextIndex < node.transforms.length;

    // If replacing a structural transform, cleanup first
    if (isReplacing && desk.isStructuralTransform(node, nextIndex) && node.parent) {
      cleanupSplitNodes(node, node.parent);
    }

    const entry = desk.createTransformEntry(transformName);
    if (!entry) return;

    if (isReplacing) {
      // Replace existing transform
      node.transforms[nextIndex] = entry;
    } else {
      // Add new transform
      node.transforms.push(entry);
    }
  }

  desk.propagateTransform(node);
  if (node.parent) desk.propagateTransform(node.parent);
  desk.triggerTreeUpdate(); // Trigger reactivity
};

/**
 * Helper for split nodes cleanup
 */

const cleanupSplitNodes = (node: ObjectNodeData, parent: ObjectNodeData): void => {
  const baseKeyPrefix = (node.key || 'part') + '_';
  const hasSplitNodes = parent.children!.some(
    (child) => child !== node && child.key?.startsWith(baseKeyPrefix)
  );

  if (hasSplitNodes) {
    parent.children = parent.children!.filter(
      (child) => child === node || !child.key?.startsWith(baseKeyPrefix)
    );
  }
};
