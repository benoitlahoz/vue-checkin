<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCheckIn } from '#vue-airport';
import { TransformNode, TransformObjectDeskKey, type NodeObject } from '.';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from '@/components/ui/select';

const props = defineProps<{
  tree: NodeObject;
}>();

const isObject = (val: any) => val && typeof val === 'object' && !Array.isArray(val);
const isArray = (val: any) => Array.isArray(val);

const transforms = computed(() => [
  {
    name: 'To Uppercase',
    if: (node: NodeObject) => typeof node.type === 'string',
    fn: (node: NodeObject) => node.value.toUpperCase(),
    params: [],
  },
  {
    name: 'To Lowercase',
    if: (node: NodeObject) => typeof node.type === 'string',
    fn: (node: NodeObject) => node.value.toLowerCase(),
    params: [],
  },
  {
    name: 'Increment',
    if: (node: NodeObject) => typeof node.type === 'number',
    fn: (node: NodeObject) => node.value + 1,
    params: [],
  },
  {
    name: 'Decrement',
    if: (node: NodeObject) => typeof node.type === 'number',
    fn: (node: NodeObject) => node.value - 1,
    params: [],
  },
  {
    name: 'Stringify',
    if: (node: NodeObject) => node.type === 'object' || node.type === 'array',
    fn: (node: NodeObject) => JSON.stringify(node.value),
    params: [],
  },
]);

const nodeId = ref('');

const { checkIn } = useCheckIn<NodeObject>();
const { desk } = checkIn(TransformObjectDeskKey, {
  autoCheckIn: true,
  watchData: true,
  data: (_desk, id) => {
    nodeId.value = String(id);
    return {
      id,
      value: props.tree.value,
      type: props.tree.type,
      children: props.tree.children || [],
      siblings: props.tree.siblings || [],
    };
  },
});
</script>

<template>
  <div class="text-xs">
    <div class="flex items-center gap-4 my-4">
      <div class="font-bold">{{ tree?.value }} - {{ tree?.type }}</div>
      <Select>
        <!-- @vue-ignore -->
        <SelectTrigger size="xs" class="px-2 py-1">
          <SelectValue placeholder="Transformation" class="text-xs" />
        </SelectTrigger>
        <SelectContent class="text-xs">
          <SelectGroup>
            <SelectLabel>Transformations disponibles</SelectLabel>
            <SelectItem
              v-for="transform in transforms.filter((t) => t.if(tree))"
              :key="transform.name"
              :value="transform.name"
              class="text-xs"
            >
              {{ transform.name }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
    <div class="border-l-2 ml-5">
      <div class="ml-5">
        <TransformNode v-for="child in tree?.children" :key="child.value" :tree="child">{{
          child.value
        }}</TransformNode>
      </div>
    </div>
    <TransformNode v-for="sibling in tree?.siblings || []" :key="sibling.value" :tree="sibling">
      {{ sibling.value }}
    </TransformNode>
  </div>
</template>
