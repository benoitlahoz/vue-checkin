<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
// (Imports UI Select inutilisés supprimés)
import DataTableCodecNode from './DataTableCodecNode.vue';

// --- Types ---
type TransformParam = {
  name: string;
  type: 'string';
  label: string;
  default: any;
};

type Transform = {
  name: string;
  if: (val: any) => boolean;
  fn: (...args: any[]) => any;
  params: TransformParam[];
};

type TransformNode = {
  name?: string;
  params: Record<string, any>;
  children: TransformNode[]; // Tree structure
};

// --- Transform Definitions ---
const transforms: Transform[] = [
  { name: 'Uppercase', if: (v) => typeof v === 'string', fn: (v) => v.toUpperCase(), params: [] },
  { name: 'Lowercase', if: (v) => typeof v === 'string', fn: (v) => v.toLowerCase(), params: [] },
  {
    name: 'Capitalize',
    if: (v) => typeof v === 'string',
    fn: (v) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
    params: [],
  },
  { name: 'Trim', if: (v) => typeof v === 'string', fn: (v) => v.trim(), params: [] },
  {
    name: 'Reverse',
    if: (v) => typeof v === 'string',
    fn: (v) => v.split('').reverse().join(''),
    params: [],
  },
  {
    name: 'Append Suffix',
    if: (v) => typeof v === 'string',
    fn: (v, suffix) => v + suffix,
    params: [{ name: 'suffix', type: 'string', label: 'Suffixe', default: 'X' }],
  },
  {
    name: 'Prepend Prefix',
    if: (v) => typeof v === 'string',
    fn: (v, prefix) => prefix + v,
    params: [{ name: 'prefix', type: 'string', label: 'Préfixe', default: 'X' }],
  },
  {
    name: 'Split',
    if: (v) => typeof v === 'string',
    fn: (v, delimiter) => v.split(delimiter || ','),
    params: [{ name: 'delimiter', type: 'string', label: 'Délimiteur', default: ',' }],
  },
  {
    name: 'Join',
    if: (v) => Array.isArray(v),
    fn: (arr, delimiter) => arr.join(delimiter || ','),
    params: [{ name: 'delimiter', type: 'string', label: 'Délimiteur', default: ',' }],
  },
];

// --- Root Value ---
const originalValue = ref<any>('John Doe');

// --- Root Nodes (pipeline) ---
const rootNodes = reactive<TransformNode[]>([createNode()]);

// --- Tree Utilities ---
function createNode(name?: string): TransformNode {
  const params: Record<string, any> = reactive({});
  if (name) {
    const t = transforms.find((x) => x.name === name);
    if (t) t.params.forEach((p) => (params[p.name] = p.default));
  }
  return reactive({ name, params, children: [] });
}

// (Fonction addRootNode supprimée, non utilisée)

// Ajout d'un sibling ou d'un enfant (branche)
function onAddChild(parentList: TransformNode[], index: number, transformName: string) {
  const t = transforms.find((x) => x.name === transformName);
  if (!t) return;
  if (t.name === 'Split') {
    // Split crée des branches (enfants)
    const splitNode = createNode(transformName);
    parentList.splice(index + 1, 0, splitNode);
    // Génère les enfants vides pour chaque partie (sera rempli lors de l'exécution)
    splitNode.children = [];
  } else {
    // Les autres transformations sont des siblings (pipeline)
    parentList.splice(index + 1, 0, createNode(transformName));
  }
}

function onRemoveNode(parentList: TransformNode[], idx: number) {
  parentList.splice(idx, 1);
}

function onUpdateParam(node: TransformNode, paramName: string, value: any) {
  node.params[paramName] = value;
}

function onAddSibling(parentList: TransformNode[], index: number) {
  parentList.splice(index + 1, 0, createNode());
}

// Mise à jour de la transformation et des paramètres du nœud
function onUpdateTransform(
  node: TransformNode,
  transformName: string,
  params: Record<string, any>
) {
  node.name = transformName;
  node.params = reactive({ ...params });
  // Si on change la transformation, on vide les enfants
  node.children = [];
  // S'assurer qu'il y a toujours un nœud vide à la fin du pipeline
  const last = rootNodes[rootNodes.length - 1];
  if (last && last.name) {
    rootNodes.push(createNode());
  }
}

// --- Execution Engine (pipeline) ---
function applyPipeline(nodes: TransformNode[], input: any): any {
  let current = input;
  for (const node of nodes) {
    if (!node.name) continue;
    const t = transforms.find((x) => x.name === node.name);
    if (!t?.if(current)) continue;
    const args = t.params.map((p) => node.params[p.name]);
    const result = t.fn(current, ...args);
    if (t.name === 'Split' && Array.isArray(result)) {
      // Split : chaque branche reçoit sa partie
      if (node.children.length === 0) {
        result.forEach(() => node.children.push(createNode()));
      }
      return result.map((part, idx) => {
        const child = node.children[idx];
        return child ? applyPipeline([child], part) : part;
      });
    }
    current = result;
  }
  return current;
}

const resultValue = computed(() => {
  return applyPipeline(rootNodes, originalValue.value);
});

function computeInputValue(idx: number): any {
  let value = originalValue.value;
  for (let i = 0; i < idx; i++) {
    const node = rootNodes[i];
    if (!node) continue;
    if (!node.name) continue;
    const t = transforms.find((x) => x.name === node.name);
    if (!t || !t.if(value)) continue;
    const args = t.params.map((p) => node.params[p.name]);
    value = t.fn(value, ...args);
    if (t.name === 'Split' && Array.isArray(value)) {
      // Pour le pipeline, on prend la première branche
      value = value[0];
    }
  }
  return value;
}
</script>

<template>
  <div class="space-y-6">
    <!-- ROOT TRANSFORM TREE UI -->
    <div class="border p-4 rounded">
      <h2 class="font-bold mb-2">Arbre des transformations</h2>
      <div class="border-l pl-4 my-2">
        <div v-for="(node, idx) in rootNodes" :key="idx">
          <DataTableCodecNode
            :node="node"
            :parent-list="rootNodes"
            :index="idx"
            :transforms="transforms"
            :input-value="computeInputValue(idx)"
            @add-child="onAddChild"
            @add-sibling="onAddSibling"
            @update-transform="onUpdateTransform"
            @remove="onRemoveNode"
            @update-param="onUpdateParam"
          />
        </div>
      </div>
    </div>
    <!-- Result Display -->
    <div class="font-mono border p-4 rounded">
      <div><strong>Valeur d'origine:</strong> {{ originalValue }}</div>
      <div v-if="Array.isArray(resultValue)">
        <strong>Résultat :</strong>
        <ul>
          <li v-for="(v, i) in resultValue" :key="i">{{ v }}</li>
        </ul>
      </div>
      <div v-else><strong>Résultat :</strong> {{ resultValue }}</div>
    </div>
  </div>
</template>
