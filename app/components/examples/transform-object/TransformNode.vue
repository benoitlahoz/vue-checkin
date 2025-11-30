<script setup lang="ts">
import { computed, ref } from 'vue';
import { TransformNode, type NodeObject, type NodeTransform, type NodeType } from '.';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const props = defineProps<{ tree: NodeObject }>();

const transforms: NodeTransform[] = [
  { name: 'To Uppercase', if: (node) => node.type === 'string', fn: (v: any) => v.toUpperCase() },
  { name: 'To Lowercase', if: (node) => node.type === 'string', fn: (v: any) => v.toLowerCase() },
  {
    name: 'To Capitalized',
    if: (node) => node.type === 'string',
    fn: (v: any) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
  },
  {
    name: 'Replace',
    if: (n) => n.type === 'string',
    params: [
      { key: 'search', label: 'Search', type: 'text', default: '' },
      { key: 'replace', label: 'Replace', type: 'text', default: '' },
    ],
    fn: (v: string, s: string, r: string) => v.replaceAll(s, r),
  },
  { name: 'Increment', if: (node) => node.type === 'number', fn: (v: any) => v + 1 },
  { name: 'Decrement', if: (node) => node.type === 'number', fn: (v: any) => v - 1 },
  {
    name: 'Stringify',
    if: (node) => node.type === 'object' || node.type === 'array',
    fn: (v: any) => JSON.stringify(v),
  },
];

const tree = ref(props.tree);
const nodeSelect = ref<string | null>(null);
const stepSelect = ref<Record<number, string | null>>({});
const availableTransforms = computed(() => {
  const type = getCurrentType(tree.value);
  return transforms.filter((t) => t.if({ ...tree.value, type: type as NodeType }));
});
const isPrimitive = computed(() =>
  ['string', 'number', 'boolean', 'bigint', 'symbol', 'undefined', 'null'].includes(tree.value.type)
);
const editingKey = ref(false);
const tempKey = ref(props.tree.key);

// Avoid prototype pollution and other unsafe keys
const FORBIDDEN_KEYS = new Set([
  '__proto__',
  'prototype',
  'constructor',
  'toString',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

function sanitizeKey(key: string): string | null {
  if (!key) return null;
  if (FORBIDDEN_KEYS.has(key)) return null;
  if (key.startsWith('__') && key.endsWith('__')) return null;
  if (key.includes('.')) return null;

  return key;
}

function autoRenameKey(parent: NodeObject, base: string) {
  let safeBase = sanitizeKey(base);
  if (!safeBase) safeBase = 'key'; // fallback

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
}

// Validate and apply key change
function confirmKeyChange() {
  const newKey = tempKey.value?.trim();

  // Empty key → revert
  if (!newKey) {
    tempKey.value = props.tree.key;
    editingKey.value = false;
    return;
  }

  // Forbidden key → revert
  if (!sanitizeKey(newKey)) {
    tempKey.value = props.tree.key;
    editingKey.value = false;
    return;
  }

  // Identical → close
  if (newKey === props.tree.key) {
    editingKey.value = false;
    return;
  }

  const parent = props.tree.parent;

  if (parent?.type === 'object' && parent.children) {
    const finalKey = autoRenameKey(parent, newKey);
    tree.value.key = finalKey;
    tempKey.value = finalKey;
  }

  editingKey.value = false;
}

// Annuler
function cancelKeyChange() {
  tempKey.value = props.tree.key;
  editingKey.value = false;
}

// Propagation des valeurs vers le parent
function propagate(node: NodeObject) {
  if (!node) return;

  if (node.type === 'object') {
    node.initialValue =
      node.children?.reduce(
        (acc: any, child) => {
          acc[child.key!] = child.transforms.reduce(
            (v, t) => t.fn(v, ...(t.params || [])),
            child.initialValue
          );
          return acc;
        },
        {} as Record<string, any>
      ) || {};
  } else if (node.type === 'array') {
    node.initialValue =
      node.children?.map((child) =>
        child.transforms.reduce((v, t) => t.fn(v, ...(t.params || [])), child.initialValue)
      ) || [];
  }

  if (node.parent) propagate(node.parent);
}

// Add or remove a transformation on the node
function handleNodeTransform(name: any) {
  if (!name) return;
  if (name === 'None') {
    tree.value.transforms = [];
  } else {
    const transform = transforms.find((t) => t.name === name);
    if (transform)
      tree.value.transforms.push({
        ...transform,
        params: initParams(transform),
      });
  }
  if (tree.value.parent) propagate(tree.value.parent);

  if (tree.value.parent) propagate(tree.value.parent);
  nodeSelect.value = tree.value.transforms.at(-1)?.name || null;
}

// Add or remove a transformation after a step in the stack
function handleStepTransform(index: number, name: any) {
  if (!name) return;

  if (name === 'None') {
    tree.value.transforms.splice(index);
  } else {
    const t = transforms.find((x) => x.name === name);
    if (t) tree.value.transforms.splice(index + 1, 0, { ...t, params: initParams(t) });
  }

  if (tree.value.parent) propagate(tree.value.parent);

  // Update the Select for this step to reflect the choice
  stepSelect.value[index] = tree.value.transforms[index]?.name || null;
}

function initParams(t: NodeTransform) {
  return t.params?.map((p) => p.default ?? null) || [];
}

// Calculate the cumulative value up to a step
function computeStepValue(index: number) {
  return tree.value.transforms
    .slice(0, index + 1)
    .reduce((val, t) => t.fn(val, ...(t.params || [])), tree.value.initialValue);
}

function getCurrentType(node: NodeObject): string {
  let value = node.initialValue;

  for (const t of node.transforms) {
    value = t.fn(value, ...(t.params || []));
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
  if (value && typeof value === 'object') return 'object';
  return 'unknown';
}
</script>

<template>
  <div class="text-xs mb-4">
    <!-- Nœud: key + valeur si primitive, Select à droite -->
    <div class="flex items-center gap-2 my-2">
      <!-- Edition du nom de la propriété -->
      <div class="cursor-pointer ml-5" @click="editingKey = true">
        <template v-if="editingKey">
          <Input
            v-model="tempKey"
            class="h-6 px-2 py-0 text-xs"
            autofocus
            @keyup.enter="confirmKeyChange"
            @blur="confirmKeyChange"
            @keyup.esc="cancelKeyChange"
          />
        </template>

        <template v-else>
          <span class="font-semibold">{{ tree.key }}</span>
        </template>
      </div>

      <!-- Valeur s'affiche juste pour primitives -->
      <template v-if="isPrimitive">
        <span class="ml-2">{{ tree.initialValue }}</span>
      </template>

      <!-- Select principal -->
      <template v-if="availableTransforms.length > 0">
        <Select v-model="nodeSelect" @update:model-value="handleNodeTransform">
          <!-- @vue-ignore -->
          <SelectTrigger size="xs" class="px-2 py-1">
            <SelectValue placeholder="+" class="text-xs" />
          </SelectTrigger>
          <SelectContent class="text-xs">
            <SelectGroup>
              <SelectLabel>Transformations</SelectLabel>
              <SelectItem value="None" class="text-xs">Remove all</SelectItem>
              <SelectItem
                v-for="tr in availableTransforms"
                :key="tr.name"
                :value="tr.name"
                class="text-xs"
              >
                {{ tr.name }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </template>
    </div>

    <!-- Children récursifs -->
    <div v-if="tree.children?.length" class="ml-5 border-l-2 pl-2">
      <TransformNode
        v-for="child in tree.children"
        :key="child.key || child.initialValue"
        :tree="child"
      />
    </div>

    <!-- Stack des transformations avec Select pour enchaîner -->
    <div v-if="tree.transforms.length" class="ml-5 pl-2 border-l-2">
      <div v-for="(t, index) in tree.transforms" :key="index" class="flex items-center gap-2 my-2">
        <span class="text-blue-600 text-xs"> {{ computeStepValue(index) }} </span>

        <template v-if="availableTransforms.length > 1">
          <!-- PARAM INPUTS FOR STACK -->
          <div v-if="t.params" class="flex gap-2">
            <div v-for="(_p, pi) in t.params" :key="'stack-param-' + index + '-' + pi">
              <Input
                v-if="transforms.find((x) => x.name === t.name)?.params?.[pi].type === 'text'"
                v-model="t.params[pi]"
                :placeholder="transforms.find((x) => x.name === t.name)?.params?.[pi].label"
                class="h-6.5 px-2 py-0"
                style="font-size: var(--text-xs)"
                @input="propagate(tree)"
              />

              <Input
                v-else-if="
                  transforms.find((x) => x.name === t.name)?.params?.[pi].type === 'number'
                "
                v-model.number="t.params[pi]"
                type="number"
                :placeholder="transforms.find((x) => x.name === t.name)?.params?.[pi].label"
                class="h-6.5 px-2 py-0 text-xs"
                @input="propagate(tree)"
              />

              <div
                v-else-if="
                  transforms.find((x) => x.name === t.name)?.params?.[pi].type === 'boolean'
                "
                class="flex items-center gap-1"
              >
                <Checkbox
                  :checked="t.params[pi]"
                  @update:checked="
                    (v: any) => {
                      t.params![pi] = v;
                      propagate(tree);
                    }
                  "
                />
                <span class="text-xs">{{ t.params![pi] ? 'true' : 'false' }}</span>
              </div>
            </div>
          </div>

          <Select
            v-model="stepSelect[index + 1]"
            size="xs"
            @update:model-value="(val) => handleStepTransform(index, val)"
          >
            <!-- @vue-ignore -->
            <SelectTrigger size="xs" class="px-2 py-1">
              <SelectValue placeholder="+" class="text-xs" />
            </SelectTrigger>
            <SelectContent class="text-xs">
              <SelectGroup>
                <SelectLabel>Next Transformation</SelectLabel>
                <SelectItem value="None" class="text-xs">Remove this & following</SelectItem>
                <SelectItem
                  v-for="tr in availableTransforms"
                  :key="tr.name"
                  :value="tr.name"
                  class="text-xs"
                >
                  {{ tr.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </template>
      </div>
    </div>
  </div>
</template>
