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

    // 🟢 REMOVE old operations from recipe when changing transforms
    if ((desk as any).recorder && node.key) {
      const oldTransformName = currentSelection;
      const structuralTransformNames = ['To Object', 'Split', 'Split Regex', 'Array to Properties'];
      const wasStructural = oldTransformName && structuralTransformNames.includes(oldTransformName);
      const isStructural = structuralTransformNames.includes(transformName);

      if (wasStructural) {
        // Removing structural transform → remove its InsertOp
        (desk as any).recorder.removeStructuralInserts(node.key, oldTransformName);
      } else {
        // Removing non-structural transform → remove its TransformOp
        (desk as any).recorder.removeTransformsByKey(node.key, oldTransformName);
      }
    }
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

      if (!isStructural && !entry.condition) {
        // Only record non-structural, non-condition transforms
        // Conditions are captured in conditionStack only

        console.log('[applyNodeTransform] Recording transform:', {
          key,
          transformName: entry.name,
          allTransforms: node.transforms.map((t) => ({ name: t.name, isCondition: !!t.condition })),
        });

        // Build condition stack: ALL conditions that precede this transform in the group
        // A "group" is a sequence starting from a condition and continuing until a transform
        // explicitly breaks the chain (which we don't have a mechanism for yet).
        // All transforms following condition(s) inherit the full condition stack.
        const conditionStack: Array<{ conditionName: string; conditionParams: any[] }> = [];

        // Iterate forward, collecting ALL conditions that appear before this transform
        for (const t of node.transforms) {
          if (t === entry) {
            // We've reached the transform we're recording, stop
            break;
          }

          if (t.condition) {
            // This is a condition, add it to the stack
            conditionStack.push({
              conditionName: t.name,
              conditionParams: t.params || [],
            });
          }
          // Don't reset on non-condition transforms - all transforms after conditions
          // should be conditional until explicitly broken
        }

        console.log('[applyNodeTransform] Built conditionStack:', conditionStack);

        // Record only the new transform (not all transforms in the array)
        // Check if this node is a child of a structural object (e.g., created by To Object)
        const parent = node.parent;
        let parentKey: string | undefined;
        let parentOpId: string | undefined;

        if (parent && parent.splitSourceId !== undefined) {
          // This parent was created by a structural transform
          parentKey = parent.key;
          parentOpId = (desk as any).recorder.getOpIdForNode(parent.id);
        }

        (desk as any).recorder.recordTransform(key, entry.name, entry.params || [], {
          parentKey,
          parentOpId,
          isCondition: false, // Never true here
          conditionStack: conditionStack.length > 0 ? conditionStack : undefined,
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

        if (!isStructural && !entry.condition) {
          // Build condition stack: ALL conditions that precede this transform
          // All transforms following condition(s) inherit the full condition stack
          const conditionStack: Array<{ conditionName: string; conditionParams: any[] }> = [];

          // Iterate forward, collecting ALL conditions until nextIndex (where entry is)
          for (let i = 0; i < nextIndex; i++) {
            const t = node.transforms[i];
            if (t.condition) {
              conditionStack.push({
                conditionName: t.name,
                conditionParams: t.params || [],
              });
            }
            // Don't reset on non-condition transforms - all transforms after conditions
            // should be conditional until explicitly broken
          }

          // Record only the new transform (not all transforms in the array)
          // Check if this node is a child of a structural object (e.g., created by To Object)
          const parent = node.parent;
          let parentKey: string | undefined;
          let parentOpId: string | undefined;

          if (parent && parent.splitSourceId !== undefined) {
            // This parent was created by a structural transform
            parentKey = parent.key;
            parentOpId = (desk as any).recorder.getOpIdForNode(parent.id);
          }

          (desk as any).recorder.recordTransform(key, entry.name, entry.params || [], {
            parentKey,
            parentOpId,
            isCondition: false,
            conditionStack: conditionStack.length > 0 ? conditionStack : undefined,
          });
        }
        // Structural transforms will be handled by model-rules.util.ts recordInsert
      }
    }
  }

  // Apply the transforms
  desk.propagateTransform(node);
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
