import type { Ref } from 'vue';
import { triggerRef } from 'vue';
import type { ObjectNodeData, Transform } from '../../types';
import {
  createPropagateTransform,
  computeStepValue,
} from '../transform/transform-propagation.util';

export interface TransformOperationsContext {
  tree: Ref<ObjectNodeData>;
  transforms: Ref<Transform[]>;
  deskRef?: () => any; // Function to get desk reference (avoids circular dependency)
}

export function createTransformOperationsMethods(context: TransformOperationsContext) {
  // 🟢 OPTIMIZATION: Map-based index for O(1) transform lookup
  const transformsByName = new Map<string, Transform[]>();

  const rebuildTransformIndex = () => {
    transformsByName.clear();
    for (const transform of context.transforms.value) {
      const existing = transformsByName.get(transform.name);
      if (existing) {
        existing.push(transform);
      } else {
        transformsByName.set(transform.name, [transform]);
      }
    }
  };

  return {
    addTransforms(...newTransforms: Transform[]) {
      context.transforms.value.push(...newTransforms);
      // Rebuild index after adding transforms
      rebuildTransformIndex();
    },

    findTransform(name: string, node?: ObjectNodeData): Transform | undefined {
      // 🟢 OPTIMIZATION: Use Map lookup O(1) instead of Array.find O(n)
      const candidates = transformsByName.get(name);
      if (!candidates) return undefined;

      // If node is provided, filter by type compatibility
      if (node) {
        return candidates.find((t) => t.if(node));
      }
      return candidates[0];
    },

    initParams(transform: Transform) {
      // Extract default VALUES from param configs
      return transform.params?.map((p) => p.default ?? null) || [];
    },

    createTransformEntry(name: string, node?: ObjectNodeData) {
      // 🟢 OPTIMIZATION: Use Map lookup O(1) instead of Array.find O(n)
      const candidates = transformsByName.get(name);
      if (!candidates) return null;

      // If node is provided, filter by type compatibility
      const transform = node ? candidates.find((t) => t.if(node)) : candidates[0];

      if (!transform) return null;

      // Create a copy with params as VALUES array (not configs)
      return {
        ...transform,
        params: transform.params?.map((p) => p.default ?? null) || [],
      };
    },

    propagateTransform(node: ObjectNodeData) {
      const desk = context.deskRef?.();
      const propagate = createPropagateTransform(desk);
      propagate(node);
      triggerRef(context.tree); // Trigger reactivity after any transform change
    },

    computeStepValue,

    // 🟢 OPTIMIZATION: Expose map-based lookup for external use (e.g., applyRecipe)
    getTransformsByName(): Map<string, Transform[]> {
      return transformsByName;
    },

    // Rebuild index (useful after bulk operations or initial load)
    rebuildTransformIndex,
  };
}
