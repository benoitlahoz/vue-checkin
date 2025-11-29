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

const nodeSelect = ref<string | null>(null);
const stepSelect = ref<Record<number, string | null>>({});

// Transformations disponibles pour le nœud
const availableTransforms = computed(() => transforms.filter((t) => t.if(props.tree)));
const isPrimitive = computed(() => ['string', 'number', 'boolean'].includes(props.tree.type));

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

// Ajouter ou supprimer une transformation sur le nœud
function handleNodeTransform(name: string | null) {
  if (!name) return;
  if (name === 'None') {
    props.tree.transforms = [];
  } else {
    const transform = transforms.find((t) => t.name === name);
    if (transform) props.tree.transforms.push(transform);
  }
  if (props.tree.parent) propagate(props.tree.parent);

  // On met à jour le Select pour refléter la dernière transformation
  nodeSelect.value = props.tree.transforms.length
    ? props.tree.transforms[props.tree.transforms.length - 1].name
    : null;
}

// Ajouter ou supprimer une transformation après une étape de la pile
function handleStepTransform(index: number, name: string | null) {
  if (!name) return;

  if (name === 'None') {
    props.tree.transforms.splice(index);
  } else {
    const transform = transforms.find((t) => t.name === name);
    if (transform) props.tree.transforms.splice(index + 1, 0, transform);
  }

  if (props.tree.parent) propagate(props.tree.parent);

  // Mettre à jour le Select de cette étape pour refléter le choix
  stepSelect.value[index] = props.tree.transforms[index]?.name || null;
}

// Calculer la valeur cumulée jusqu'à une étape
function computeStepValue(index: number) {
  return props.tree.transforms
    .slice(0, index + 1)
    .reduce((val, t) => t.fn(val, ...(t.params || [])), props.tree.initialValue);
}
</script>

<template>
  <div class="text-xs">
    <!-- Nœud: key + valeur si primitive, Select à droite -->
    <div class="flex items-center gap-2 my-1">
      <span class="font-semibold">{{ tree.key }}</span>
      <template v-if="isPrimitive">
        <span class="ml-2">{{ tree.initialValue }}</span>
      </template>

      <template v-if="availableTransforms.length > 0">
        <Select v-model="nodeSelect" @update:model-value="handleNodeTransform">
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

    <!-- Stack des transformations avec Select pour enchaîner -->
    <div class="ml-5 pl-2 border-l-2" v-if="tree.transforms.length">
      <div v-for="(t, index) in tree.transforms" :key="index" class="flex items-center gap-2 my-1">
        <span class="text-blue-600 text-xs"> → {{ t.name }}: {{ computeStepValue(index) }} </span>

        <template v-if="availableTransforms.length > 0">
          <Select
            size="xs"
            v-model="stepSelect[index]"
            @update:model-value="(val) => handleStepTransform(index, val)"
          >
            <SelectTrigger size="xs" class="px-1 py-0">
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

    <!-- Children récursifs -->
    <div class="ml-5 border-l-2 pl-2" v-if="tree.children?.length">
      <TransformNode v-for="child in tree.children" :key="child.key || child.value" :tree="child" />
    </div>
  </div>
</template>
