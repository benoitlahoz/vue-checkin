<script setup lang="ts">
import { ref } from 'vue';
import { useCheckIn } from 'vue-airport';
import {
  TransformerNode,
  ObjectTransformerDeskKey,
  type ObjectNode,
  type ObjectNodeType,
  type Transform,
  type ObjectTransformerContext,
  type ObjectTransformerDesk,
} from '.';
import { buildNodeTree } from './utils/node-builder.util';
import {
  computeIntermediateValue,
  computeStepValue,
  createPropagateTransform,
} from './utils/transform-propagation.util';
import { getTypeFromValue } from './utils/type-guards.util';
import {
  sanitizeKey,
  autoRenameKey,
  formatValue,
  isAddedProperty,
  getKeyClasses,
  generateChildKey,
  forbiddenKeys,
} from './utils/node-utilities.util';

export interface ObjectTransformerProps {
  data?: Record<string, any> | any[];
}

const props = withDefaults(defineProps<ObjectTransformerProps>(), {
  data: () => ({}),
});

const { createDesk } = useCheckIn<ObjectNode, ObjectTransformerContext>();
const { desk } = createDesk(ObjectTransformerDeskKey, {
  devTools: true,
  context: {
    // Tree
    tree: ref<ObjectNode>(
      buildNodeTree(props.data, Array.isArray(props.data) ? 'Array' : 'Object')
    ),
    getNode(id: string): ObjectNode | null {
      // Recursive search in the tree
      const findNode = (node: ObjectNode): ObjectNode | null => {
        if (node.id === id) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNode(child);
            if (found) return found;
          }
        }
        return null;
      };
      return findNode(this.tree.value);
    },

    // Constants
    primitiveTypes: [
      'string',
      'number',
      'boolean',
      'bigint',
      'symbol',
      'undefined',
      'null',
      'date',
      'function',
    ] as ObjectNodeType[],

    // Transforms
    transforms: ref<Transform[]>([]),
    addTransforms(...newTransforms: Transform[]) {
      this.transforms.value.push(...newTransforms);
    },
    findTransform(name: string, node?: ObjectNode): Transform | undefined {
      // If node is provided, filter by type compatibility
      if (node) {
        return this.transforms.value.find((t) => t.name === name && t.if(node));
      }
      return this.transforms.value.find((t) => t.name === name);
    },
    initParams(transform: Transform) {
      return transform.params?.map((p) => p.default ?? null) || [];
    },
    createTransformEntry(name: string, node?: ObjectNode) {
      const transform = this.findTransform(name, node);
      return transform ? { ...transform, params: this.initParams(transform) } : null;
    },
    propagateTransform(node: ObjectNode) {
      const propagate = createPropagateTransform(desk as ObjectTransformerDesk);
      propagate(node);
    },
    computeStepValue,

    // Nodes
    forbiddenKeys: ref<string[]>(forbiddenKeys),
    getComputedValueType(_node: ObjectNode, value: any): ObjectNodeType {
      return getTypeFromValue(value);
    },

    // Key editing
    editingNode: ref<ObjectNode | null>(null),
    tempKey: ref<string | null>(null),
    startEditKey(node: ObjectNode) {
      this.editingNode.value = node;
      this.tempKey.value = node.key || null;
    },
    confirmEditKey(node: ObjectNode) {
      const newKey = this.tempKey.value?.trim();

      if (!newKey || !sanitizeKey(newKey)) {
        this.tempKey.value = node.key || null;
        this.editingNode.value = null;
        return;
      }

      if (newKey === node.key) {
        this.editingNode.value = null;
        return;
      }

      const parent = node.parent;
      if (parent?.type === 'object' && parent.children) {
        const finalKey = autoRenameKey(parent, newKey);
        node.key = finalKey;
        node.keyModified = true;
        this.tempKey.value = finalKey;
        this.propagateTransform(parent);
      }

      this.editingNode.value = null;
    },
    cancelEditKey(node: ObjectNode) {
      this.tempKey.value = node.key || null;
      this.editingNode.value = null;
    },

    // Node utilities (using pure functions)
    isAddedProperty,
    getKeyClasses,
    generateChildKey,
    toggleNodeDeletion(node: ObjectNode) {
      node.deleted = !node.deleted;
      if (node.parent) {
        this.propagateTransform(node.parent);
      }
    },

    // Transform selections
    nodeSelections: new WeakMap<ObjectNode, string | null>(),
    stepSelections: new WeakMap<ObjectNode, Record<number, string | null>>(),
    getNodeSelection(node: ObjectNode): string | null {
      if (!this.nodeSelections.has(node)) {
        const initial = node.transforms.length > 0 ? node.transforms.at(-1)?.name || null : null;
        this.nodeSelections.set(node, initial);
      }
      return this.nodeSelections.get(node) || null;
    },
    setNodeSelection(node: ObjectNode, value: string | null) {
      this.nodeSelections.set(node, value);
    },
    getStepSelection(node: ObjectNode): Record<number, string | null> {
      if (!this.stepSelections.has(node)) {
        this.stepSelections.set(node, {});
      }
      return this.stepSelections.get(node) || {};
    },
    setStepSelection(node: ObjectNode, value: Record<number, string | null>) {
      this.stepSelections.set(node, value);
    },

    // Helpers
    getParamConfig(transformName: string, paramIndex: number) {
      return this.transforms.value.find((x) => x.name === transformName)?.params?.[paramIndex];
    },
    formatStepValue(node: ObjectNode, index: number): string {
      const value = this.computeStepValue(node, index);
      const type = this.getComputedValueType(node, value);
      return formatValue(value, type);
    },
    isStructuralTransform(node: ObjectNode, transformIndex: number): boolean {
      const t = node.transforms[transformIndex];
      if (!t) return false;

      const value = computeIntermediateValue(node);
      const result = t.fn(value, ...(t.params || []));

      return result && typeof result === 'object' && result.__structuralChange === true;
    },
  },
});

watch(
  () => props.data,
  (newData) => {
    (desk as ObjectTransformerDesk).tree.value = buildNodeTree(
      newData,
      Array.isArray(newData) ? 'Array' : 'Object'
    );
  },
  { deep: true }
);
</script>

<template>
  <TransformerNode :id="null" />
  <slot />
</template>

<style scoped></style>
