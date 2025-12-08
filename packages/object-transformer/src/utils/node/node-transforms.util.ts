import { maybe } from 'vue-airport';
import type { ObjectNodeData, Transform, ObjectTransformerDesk } from '../../types';

/**
 * Transform filtering - Pure functions
 */
export const filterTransformsByType = (transforms: Transform[], nodeType: string): Transform[] => {
  const nodeStub = { type: nodeType } as ObjectNodeData;

  return transforms.filter((t) => {
    // Check applicableTo first (declarative, more performant)
    const checkApplicableTo = (transform: Transform) =>
      transform.applicableTo?.includes(nodeType as any) ?? null;

    // Fall back to if check for advanced conditions
    const checkIf = (transform: Transform) => transform.if?.(nodeStub) ?? null;

    // Try applicableTo, then if, default to true if neither exists
    return maybe(checkApplicableTo, null)(t) ?? maybe(checkIf, null)(t) ?? true;
  });
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

    // 🟢 RECORD THE REMOVAL (v4.0: no recording needed for clearing transforms)
    // Transforms are now recorded individually, so clearing just means no more transform ops
    // The delta sequence will simply not have transform operations for this key

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

  // 🟢 RECORD THE OPERATION (Delta-based recording)
  // Record only the NEW transform that was just added
  const key = node.key;

  if ((desk as any).recorder && key) {
    const isModelMode = desk.mode?.value === 'model';
    const isTemplateRoot = !node.parent;

    // Skip recording template root operations in model mode
    if (!isModelMode || !isTemplateRoot) {
      // Detect structural transforms - they should record as insert operations
      const structuralTransformNames = ['To Object', 'Split', 'Split Regex', 'Array to Properties'];
      const isStructural = structuralTransformNames.includes(transformName);

      if (!isStructural) {
        // Record only the new transform (not all transforms in the array)
        (desk as any).recorder.recordTransform(key, entry.name, entry.params || [], {
          isCondition: !!entry.condition,
        });
      }
      // Structural transforms will be handled by model-rules.util.ts recordInsert
    }
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

    // 🟢 RECORD THE REMOVAL
    // When removing transforms, we don't record anything - the recipe just won't have those transform ops
    // The delta sequence represents what TO DO, not what NOT to do
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

    // 🟢 RECORD THE OPERATION
    // Record only the NEW transform that was just added/replaced
    const key = node.key;
    if ((desk as any).recorder && key) {
      const isModelMode = desk.mode?.value === 'model';
      const isTemplateRoot = !node.parent;

      if (!isModelMode || !isTemplateRoot) {
        const structuralTransformNames = [
          'To Object',
          'Split',
          'Split Regex',
          'Array to Properties',
        ];
        const isStructural = structuralTransformNames.includes(entry.name);

        if (!isStructural) {
          // Record only the new transform (not all transforms in the array)
          (desk as any).recorder.recordTransform(key, entry.name, entry.params || [], {
            isCondition: !!entry.condition,
          });
        }
        // Structural transforms will be handled by model-rules.util.ts recordInsert
      }
    }
  }

  // Apply the transforms
  if (node.parent) desk.propagateTransform(node.parent);
  desk.triggerTreeUpdate(); // Trigger reactivity
};

/**
 * Helper for split nodes cleanup
 */

const cleanupSplitNodes = (node: ObjectNodeData, parent: ObjectNodeData): void => {
  // Find all nodes that were created from this source node (using splitSourceId)
  const hasSplitNodes = parent.children!.some(
    (child) => child !== node && child.splitSourceId === node.id
  );

  if (hasSplitNodes) {
    parent.children = parent.children!.filter(
      (child) => child === node || child.splitSourceId !== node.id
    );
  }
};
