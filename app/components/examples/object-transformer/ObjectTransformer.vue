<script setup lang="ts">
import { ref } from 'vue';
import { useCheckIn } from 'vue-airport';
import {
  ObjectTransformerNode,
  ObjectTransformerDeskKey,
  type ObjectNode,
  type ObjectNodeType,
  type Transform,
  type ObjectTransformerContext,
  type ObjectTransformerDesk,
} from '.';

export interface ObjectTransformerProps {
  data?: Record<string, any> | any[];
}

const props = withDefaults(defineProps<ObjectTransformerProps>(), {
  data: () => ({}),
});

const tree = ref<ObjectNode>(
  buildNodeTree(props.data, Array.isArray(props.data) ? 'Array' : 'Object')
);

watch(
  () => props.data,
  (newData) => {
    tree.value = buildNodeTree(newData, Array.isArray(newData) ? 'Array' : 'Object');
  },
  { deep: true }
);

function buildNodeTree(value: any, key?: string, parent?: ObjectNode): ObjectNode {
  // Handle null first (before typeof checks)
  if (value === null) {
    return {
      type: 'null',
      key,
      value: null,
      transforms: [],
      parent,
    };
  }

  // Handle arrays
  if (Array.isArray(value)) {
    const node: ObjectNode = {
      type: 'array',
      key,
      value: [],
      transforms: [],
      children: [],
      parent,
    };

    node.children = value.map((item, index) => buildNodeTree(item, String(index), node));

    // Build the initial value from children
    node.value = node.children.map((c) => c.value);

    return node;
  }

  // Handle Date objects
  if (value instanceof Date) {
    return {
      type: 'date',
      key,
      value,
      transforms: [],
      parent,
    };
  }

  // Handle objects (after Date check since Date is also an object)
  if (typeof value === 'object') {
    const node: ObjectNode = {
      type: 'object',
      key,
      value: {},
      transforms: [],
      children: [],
      parent,
    };

    node.children = Object.entries(value).map(([k, v]) => buildNodeTree(v, k, node));

    // Build the initial value from children
    node.value = node.children.reduce(
      (acc, c) => {
        acc[c.key!] = c.value;
        return acc;
      },
      {} as Record<string, any>
    );

    return node;
  }

  // Handle primitives and other types
  const typeOf = typeof value;
  let type: ObjectNodeType;

  switch (typeOf) {
    case 'string':
      type = 'string';
      break;
    case 'number':
      type = 'number';
      break;
    case 'bigint':
      type = 'bigint';
      break;
    case 'boolean':
      type = 'boolean';
      break;
    case 'symbol':
      type = 'symbol';
      break;
    case 'undefined':
      type = 'undefined';
      break;
    case 'function':
      type = 'function';
      break;
    default:
      type = 'unknown';
  }

  return {
    type,
    key,
    value: value,
    transforms: [],
    parent,
  };
}

function isStructuralResult(result: any): boolean {
  return result && typeof result === 'object' && result.__structuralChange === true;
}

// Helper: Calculer la valeur intermédiaire avant la dernière transformation
function computeIntermediateValue(node: ObjectNode): any {
  let intermediateValue = node.value;
  for (let i = 0; i < node.transforms.length - 1; i++) {
    const t = node.transforms[i];
    if (!t) continue;
    const result = t.fn(intermediateValue, ...(t.params || []));
    // Si on rencontre une transformation structurelle avant, arrêter
    if (isStructuralResult(result)) {
      break;
    }
    intermediateValue = result;
  }
  return intermediateValue;
}

// Helper: Gérer le split/arrayToProperties en créant de nouveaux nœuds
function handleStructuralSplit(
  node: ObjectNode,
  parts: any[],
  removeSource: boolean,
  desk: ObjectTransformerDesk
) {
  if (!node.parent) return;

  const currentIndex = node.parent.children?.indexOf(node) ?? -1;
  if (currentIndex === -1) return;

  const baseKeyPrefix = (node.key || 'part') + '_';
  const hasSplitNodes = node.parent.children!.some(
    (child) => child !== node && child.key?.startsWith(baseKeyPrefix)
  );

  const baseKey = node.key || 'part';
  const newNodes = parts.map((part: any, i: number) => {
    const newKey = `${baseKey}_${i}`;
    return buildNodeTree(part, newKey, node.parent);
  });

  if (hasSplitNodes) {
    // Supprimer TOUS les anciens nœuds splittés
    const filteredChildren = node.parent.children!.filter(
      (child) => child === node || !child.key?.startsWith(baseKeyPrefix)
    );

    // Trouver la nouvelle position du nœud source
    const newIndex = filteredChildren.indexOf(node);
    // Insérer les nouveaux nœuds
    const updatedChildren = [
      ...filteredChildren.slice(0, newIndex + 1),
      ...newNodes,
      ...filteredChildren.slice(newIndex + 1),
    ];

    node.parent.children = updatedChildren;
  } else {
    // Première fois : créer les nouveaux nœuds
    if (removeSource) {
      node.parent.children!.splice(currentIndex, 1, ...newNodes);
    } else {
      node.parent.children!.splice(currentIndex + 1, 0, ...newNodes);
    }
  }

  desk.propagateTransform(node.parent);
}

// Helper: Calculer la valeur transformée d'un enfant (ignore les structurelles)
function computeChildTransformedValue(child: ObjectNode): any {
  return child.transforms.reduce((v, t) => {
    const result = t.fn(v, ...(t.params || []));
    return isStructuralResult(result) ? v : result;
  }, child.value);
}

// Helper: Propager pour un objet
function propagateObjectValue(node: ObjectNode) {
  node.value =
    node.children
      ?.filter((child) => !child.deleted)
      ?.reduce(
        (acc: any, child) => {
          acc[child.key!] = computeChildTransformedValue(child);
          return acc;
        },
        {} as Record<string, any>
      ) || {};
}

// Helper: Propager pour un tableau
function propagateArrayValue(node: ObjectNode) {
  node.value =
    node.children
      ?.filter((child) => !child.deleted)
      ?.map((child) => computeChildTransformedValue(child)) || [];
}

const { createDesk } = useCheckIn<ObjectNode, ObjectTransformerContext>();
const { desk } = createDesk(ObjectTransformerDeskKey, {
  devTools: true,
  context: {
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
    findTransform(name: string): Transform | undefined {
      return this.transforms.value.find((t) => t.name === name);
    },
    initParams(transform: Transform) {
      return transform.params?.map((p) => p.default ?? null) || [];
    },
    createTransformEntry(name: string) {
      const transform = this.findTransform(name);
      return transform ? { ...transform, params: this.initParams(transform) } : null;
    },
    propagateTransform(node: ObjectNode) {
      if (!node) return;

      // Gérer les transformations structurelles
      if (node.transforms.length > 0) {
        const lastTransform = node.transforms[node.transforms.length - 1];
        if (!lastTransform) return;

        // Calculer la valeur intermédiaire avant la dernière transformation
        const intermediateValue = computeIntermediateValue(node);

        // Appliquer la dernière transformation
        const lastResult = lastTransform.fn(intermediateValue, ...(lastTransform.params || []));

        // Gérer les transformations structurelles (split, arrayToProperties)
        if (
          lastResult &&
          typeof lastResult === 'object' &&
          lastResult.__structuralChange &&
          (lastResult.action === 'split' || lastResult.action === 'arrayToProperties') &&
          lastResult.parts &&
          node.parent
        ) {
          handleStructuralSplit(
            node,
            lastResult.parts,
            lastResult.removeSource,
            desk as ObjectTransformerDesk
          );
          return;
        }
      }

      // Propager les valeurs pour les objets et tableaux
      if (node.type === 'object') {
        propagateObjectValue(node);
      } else if (node.type === 'array') {
        propagateArrayValue(node);
      }

      // Propager au parent
      if (node.parent) (desk as ObjectTransformerDesk).propagateTransform(node.parent);
    },
    computeStepValue(node: ObjectNode, index: number) {
      let value = node.value;

      for (let i = 0; i <= index; i++) {
        const t = node.transforms[i];
        if (!t) continue;

        const result = t.fn(value, ...(t.params || []));

        // Si c'est une transformation structurelle, arrêter ici
        if (isStructuralResult(result)) {
          break;
        }

        // Transformation normale
        value = result;
      }
      return value;
    },

    // Nodes
    forbiddenKeys: ref<string[]>([
      '__proto__',
      'prototype',
      'constructor',
      'toString',
      '__defineGetter__',
      '__defineSetter__',
      '__lookupGetter__',
      '__lookupSetter__',
    ]),
    sanitizeKey(key: string): string | null {
      if (!key) return null;
      if (this.forbiddenKeys.value.includes(key)) return null;
      if (key.startsWith('__') && key.endsWith('__')) return null;
      if (key.includes('.')) return null;
      return key;
    },
    autoRenameKey(parent: ObjectNode, base: string): string {
      let safeBase = this.sanitizeKey(base);
      if (!safeBase) safeBase = 'key';

      if (!parent.children?.some((c) => c.key === safeBase)) {
        return safeBase;
      }

      let i = 1;
      let candidate = `${safeBase}_${i}`;

      while (parent.children?.some((c) => c.key === candidate)) {
        i++;
        candidate = `${safeBase}_${i}`;
      }

      return candidate;
    },
    getNodeType(node: ObjectNode) {
      let value = node.value;

      // Ne traiter que les transformations jusqu'à la première transformation structurelle
      for (const t of node.transforms) {
        // Vérifier d'abord si c'est une transformation structurelle
        // Pour cela, on regarde si la transformation a une propriété 'structural' ou si son résultat l'indique
        // On doit exécuter pour vérifier, mais on s'arrête immédiatement après
        const result = t.fn(value, ...(t.params || []));

        if (isStructuralResult(result)) {
          // Transformation structurelle trouvée : arrêter ici
          // Le type reste celui de la valeur AVANT la transformation structurelle
          break;
        }

        // Transformation normale : appliquer
        value = result;
      }

      const t = typeof value;
      if (t === 'string') return 'string';
      if (t === 'symbol') return 'symbol';
      if (t === 'number') return 'number';
      if (t === 'bigint') return 'bigint';
      if (t === 'boolean') return 'boolean';
      if (t === 'undefined') return 'undefined';
      if (t === 'function') return 'function';
      if (t === null) return 'null';
      if (Array.isArray(value)) return 'array';
      if (value instanceof Date) return 'date';
      if (value && typeof value === 'object') return 'object';
      return 'unknown';
    },
    getComputedValueType(node: ObjectNode, value: any): ObjectNodeType {
      return this.getNodeType({ ...node, value });
    },
    formatValue(value: any, type: ObjectNodeType): string {
      const formatters: Partial<Record<ObjectNodeType, (v: any) => string>> = {
        date: (v) => (v instanceof Date ? v.toISOString() : String(v)),
        function: (v) => `[Function: ${v.name || 'anonymous'}]`,
        bigint: (v) => `${v}n`,
        symbol: (v) => v.toString(),
        undefined: () => 'undefined',
        null: () => 'null',
      };
      return formatters[type]?.(value) ?? String(value);
    },
  },
});
</script>

<template>
  <ObjectTransformerNode :tree="tree" />
  <slot />
</template>

<style scoped></style>
