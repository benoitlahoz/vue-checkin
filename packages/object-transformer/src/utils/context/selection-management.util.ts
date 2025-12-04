import type { ObjectNodeData } from '../../types';

export interface SelectionManagementContext {
  nodeSelections: WeakMap<ObjectNodeData, string | null>;
  stepSelections: WeakMap<ObjectNodeData, Record<number, string | null>>;
}

export function createSelectionManagementMethods(context: SelectionManagementContext) {
  return {
    getNodeSelection(node: ObjectNodeData): string | null {
      // If node has no transforms, always return null
      if (node.transforms.length === 0) {
        context.nodeSelections.set(node, null);
        return null;
      }

      // Always sync with the FIRST transform (index 0)
      const firstTransformName = node.transforms[0]?.name || null;
      context.nodeSelections.set(node, firstTransformName);
      return firstTransformName;
    },

    setNodeSelection(node: ObjectNodeData, value: string | null) {
      context.nodeSelections.set(node, value);
    },

    getStepSelection(node: ObjectNodeData): Record<number, string | null> {
      if (!context.stepSelections.has(node)) {
        context.stepSelections.set(node, {});
      }

      const currentSelections = context.stepSelections.get(node) || {};

      // Clean up selections for indices beyond the number of transforms
      const cleanedSelections: Record<number, string | null> = {};
      Object.entries(currentSelections).forEach(([key, value]) => {
        const idx = parseInt(key);
        // Keep only selections for valid transform indices
        if (idx < node.transforms.length) {
          cleanedSelections[idx] = value;
        }
      });

      context.stepSelections.set(node, cleanedSelections);
      return cleanedSelections;
    },

    setStepSelection(node: ObjectNodeData, value: Record<number, string | null>) {
      context.stepSelections.set(node, value);
    },
  };
}
