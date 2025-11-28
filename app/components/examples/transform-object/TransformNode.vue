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
    if: (v: any) => typeof v === 'string',
    fn: (v: string) => v.toUpperCase(),
    params: [],
  },
  {
    name: 'To Lowercase',
    if: (v: any) => typeof v === 'string',
    fn: (v: string) => v.toLowerCase(),
    params: [],
  },
  {
    name: 'Increment',
    if: (v: any) => typeof v === 'number',
    fn: (v: number) => v + 1,
    params: [],
  },
  {
    name: 'Decrement',
    if: (v: any) => typeof v === 'number',
    fn: (v: number) => v - 1,
    params: [],
  },
  {
    name: 'Stringify',
    if: (v: any) => isObject(v) || isArray(v),
    fn: (v: any) => JSON.stringify(v),
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
          <SelectValue placeholder="Ajouter un enfant" class="text-xs" />
        </SelectTrigger>
        <SelectContent class="text-xs">
          <SelectGroup>
            <SelectLabel>Ajouter un enfant</SelectLabel>
            <SelectItem value="Child" class="text-xs">Child</SelectItem>
            <SelectItem value="Leaf" class="text-xs">Leaf</SelectItem>
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
