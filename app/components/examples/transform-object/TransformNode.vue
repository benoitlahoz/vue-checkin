<script setup lang="ts">
import { computed, ref } from 'vue';
import { TransformNode, type NodeObject, type NodeTransform } from '.';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from '@/components/ui/select';

const props = defineProps<{ tree: NodeObject }>();

const transforms: NodeTransform[] = [
  { name: 'To Uppercase', if: (node) => node.type === 'string', fn: (v: any) => v.toUpperCase() },
  { name: 'To Lowercase', if: (node) => node.type === 'string', fn: (v: any) => v.toLowerCase() },
  {
    name: 'To Capitalized',
    if: (node) => node.type === 'string',
    fn: (v: any) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
  },
  { name: 'Increment', if: (node) => node.type === 'number', fn: (v: any) => v + 1 },
  { name: 'Decrement', if: (node) => node.type === 'number', fn: (v: any) => v - 1 },
  {
    name: 'Stringify',
    if: (node) => node.type === 'object' || node.type === 'array',
    fn: (v: any) => JSON.stringify(v),
  },
];

const selectedTransform = ref<Record<number, string>>({}); // un select par étape

const isPrimitive = computed(() => !['object', 'array'].includes(props.tree.type));

const currentValue = computed(() =>
  props.tree.transforms.reduce((val, t) => t.fn(val, ...(t.params || [])), props.tree.initialValue)
);

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

// Transformations disponibles pour ce nœud
const availableTransforms = computed(() => transforms.filter((t) => t.if(props.tree)));

// Ajouter une transformation à l'étape suivante dans la stack
function handleStepTransform(index: number, name: string) {
  const transform = transforms.find((t) => t.name === name);
  if (!transform) return;

  // Ajouter juste après l'étape actuelle
  props.tree.transforms.splice(index + 1, 0, transform);

  // Recalculer les parents
  if (props.tree.parent) propagate(props.tree.parent);

  // Réinitialiser le select de cette étape
  selectedTransform.value[index] = '';
}
</script>

<template>
  <div class="text-xs">
    <!-- Nœud -->
    <div class="flex items-center gap-2 my-1">
      <span class="font-semibold">{{ tree.key }}</span>
      <template v-if="isPrimitive">
        <span class="ml-2">{{ currentValue }}</span>
      </template>
    </div>

    <!-- Transformations cumulatives avec Select à droite de chaque étape -->
    <div class="ml-5 pl-2 border-l-2">
      <div v-for="(t, index) in tree.transforms" :key="index" class="flex items-center gap-2 my-1">
        <span class="text-blue-600 text-xs">
          → {{ t.name }}:
          {{
            tree.transforms
              .slice(0, index + 1)
              .reduce((val, tr) => tr.fn(val, ...(tr.params || [])), tree.initialValue)
          }}
        </span>

        <!-- Select pour enchaîner une nouvelle transformation après cette étape -->
        <Select
          size="xs"
          v-model="selectedTransform[index]"
          @update:model-value="(val) => handleStepTransform(index, val)"
        >
          <SelectTrigger size="xs" class="px-1 py-0">
            <SelectValue placeholder="+" class="text-xs" />
          </SelectTrigger>
          <SelectContent class="text-xs">
            <SelectGroup>
              <SelectLabel>Next Transformation</SelectLabel>
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
      </div>

      <!-- Ajouter transformation si aucune étape existante -->
      <template v-if="tree.transforms.length === 0 && availableTransforms.length > 0">
        <Select
          size="xs"
          v-model="selectedTransform[-1]"
          @update:model-value="(val) => handleStepTransform(-1, val)"
        >
          <SelectTrigger size="xs" class="px-1 py-0">
            <SelectValue placeholder="+" class="text-xs" />
          </SelectTrigger>
          <SelectContent class="text-xs">
            <SelectGroup>
              <SelectLabel>Add Transformation</SelectLabel>
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
    <div class="ml-5 border-l-2 pl-2" v-if="tree.children?.length">
      <TransformNode v-for="child in tree.children" :key="child.key || child.value" :tree="child" />
    </div>
  </div>
</template>
