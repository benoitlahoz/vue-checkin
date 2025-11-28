<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
// (Imports UI Select inutilisés supprimés)
import DataTableCodecNode from './DataTableCodecNode.vue';

import type { Transform, TransformParam, CodecNode } from './types/codec';

const transforms: Transform[] = [
  {
    name: 'Uppercase',
    if: (v: any) => typeof v === 'string',
    fn: (v: string) => v.toUpperCase(),
    params: [],
  },
  {
    name: 'Lowercase',
    if: (v: any) => typeof v === 'string',
    fn: (v: string) => v.toLowerCase(),
    params: [],
  },
  {
    name: 'Capitalize',
    if: (v: any) => typeof v === 'string',
    fn: (v: string) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
    params: [],
  },
  { name: 'Trim', if: (v: any) => typeof v === 'string', fn: (v: string) => v.trim(), params: [] },
  {
    name: 'Reverse',
    if: (v: any) => typeof v === 'string',
    fn: (v: string) => v.split('').reverse().join(''),
    params: [],
  },
  {
    name: 'Suffix',
    if: (v: any) => typeof v === 'string',
    fn: (v: string, suffix: string) => v + suffix,
    params: [{ name: 'suffix', type: 'string', label: 'Suffixe', default: '' }],
  },
  {
    name: 'Prefix',
    if: (v: any) => typeof v === 'string',
    fn: (v: string, prefix: string) => prefix + v,
    params: [{ name: 'prefix', type: 'string', label: 'Préfixe', default: '' }],
  },
  {
    name: 'Split',
    if: (v: any) => typeof v === 'string',
    fn: (v: string, delimiter: string) => v.split(delimiter || ','),
    params: [{ name: 'delimiter', type: 'string', label: 'Délimiteur', default: ',' }],
  },
];

// --- Root Nodes (pipeline) ---

// --- Tree Utilities ---
function createNode(name?: string): CodecNode {
  const params: Record<string, any> = reactive({});
  if (name) {
    const t = transforms.find((x) => x.name === name);
    if (t) t.params.forEach((p: TransformParam) => (params[p.name] = p.default));
  }
  return reactive({ name, params, siblings: [], children: [] });
}

const originalValue = ref<any>('John Doe');
const rootNodes = reactive<CodecNode[]>([createNode()]);

function onAddChild(parent: CodecNode, transformName: string) {
  parent.children.push(createNode(transformName));
}
function onRemoveNode(parent: CodecNode, idx: number, type: 'sibling' | 'child') {
  if (type === 'sibling') parent.siblings.splice(idx, 1);
  else parent.children.splice(idx, 1);
}
function onUpdateParam(node: CodecNode, paramName: string, value: any) {
  node.params[paramName] = value;
}
function onAddSibling(node: CodecNode) {
  node.siblings.push(createNode());
}
function onUpdateSplitChildren(node: CodecNode, delimiter: string) {
  const idx = rootNodes.indexOf(node);
  let input = '';
  if (idx !== -1) {
    // input = computeInputValue(idx); // Fonction non définie
  } else if ((node as any)._inputValue) {
    input = (node as any)._inputValue;
  }
  const t = transforms.find((x) => x.name === node.name);
  if (!t) return;
  const args = t.params.map((p) => node.params[p.name]);
  const result = t.fn(input, ...args);
  if (Array.isArray(result)) {
    node.children = result.map(() => createNode());
  } else {
    node.children = [];
  }
}
function onUpdateTransform(node: CodecNode, transformName: string, params: Record<string, any>) {
  node.name = transformName;
  node.params = reactive({ ...params });
  node.children = [];
  // Crée un sibling automatiquement si aucun n'existe
  if (node.siblings.length === 0) {
    node.siblings.push(createNode());
  }
}
function applyPipeline(node: CodecNode, input: any): any {
  if (!node || !node.name) return input;
  const t = transforms.find((x) => x.name === node.name);
  if (!t?.if(input)) return input;
  const args = t.params.map((p) => node.params[p.name]);
  const result = t.fn(input, ...args);
  if (Array.isArray(result)) {
    if (!node.children || node.children.length !== result.length) {
      node.children = Array(result.length)
        .fill(null)
        .map(() => createNode());
    }
    return result.map((part, idx) =>
      node.children[idx] ? applyPipeline(node.children[idx], part) : undefined
    );
  }
  let current = result;
  if (node.siblings && node.siblings.length) {
    for (const sib of node.siblings) {
      current = applyPipeline(sib, current);
    }
  }
  return current;
}
const resultValue = computed(() =>
  rootNodes[0] ? applyPipeline(rootNodes[0], originalValue.value) : undefined
);
function formatResult(val: any): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(formatResult).join(', ');
  if (val == null) return '';
  if (typeof val === 'object') {
    // Affiche les valeurs primitives ou tableaux, évite les objets CodecNode
    if ('name' in val && 'params' in val && 'siblings' in val && 'children' in val) {
      return val.name || '[node]';
    }
    return Object.values(val).map(formatResult).join(', ');
  }
  return String(val);
}
</script>

<template>
  <div class="codec-root">
    <h3>Valeur d'origine</h3>
    <pre>{{ originalValue }}</pre>
    <h3>Pipeline</h3>
    <DataTableCodecNode
      v-if="rootNodes[0]"
      :node="rootNodes[0]"
      :parent="null"
      :transforms="transforms"
      :input-value="originalValue"
      @add-child="onAddChild"
      @add-sibling="onAddSibling"
      @remove-node="onRemoveNode"
      @update-param="onUpdateParam"
      @update-transform="onUpdateTransform"
    />
    <h3>Résultat</h3>
    <pre>{{ formatResult(resultValue) }}</pre>
  </div>
</template>
