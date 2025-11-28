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

const transforms = computed(() => [
  {
    name: 'To Uppercase',
    if: (node: NodeObject) => node.type === 'string',
    fn: (node: NodeObject) => node.value.toUpperCase(),
    params: [],
  },
  {
    name: 'To Lowercase',
    if: (node: NodeObject) => node.type === 'string',
    fn: (node: NodeObject) => node.value.toLowerCase(),
    params: [],
  },
  {
    name: 'Increment',
    if: (node: NodeObject) => node.type === 'number',
    fn: (node: NodeObject) => node.value + 1,
    params: [],
  },
  {
    name: 'Decrement',
    if: (node: NodeObject) => node.type === 'number',
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

const addSibling = (node: NodeObject, value: any) => {
  if (!node.siblings) node.siblings = [];
  node.siblings.push({
    value,
    type: typeof value,
    children: [],
  });
};

const selectedTransform = ref('');

function handleTransformChange(transformName: string) {
  const transform = transforms.value.find((t) => t.name === transformName);
  if (transform) {
    const transformedValue = transform.fn(props.tree);
    addSibling(props.tree, transformedValue);
  }
  selectedTransform.value = '';
}

const { checkIn } = useCheckIn<NodeObject>();
checkIn(TransformObjectDeskKey, {
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
    <div class="flex items-center gap-4 my-2">
      <div class="font-bold">{{ tree?.value }}</div>
      <template v-if="transforms.filter((t) => t.if(tree)).length > 0">
        <Select v-model="selectedTransform" @update:modelValue="handleTransformChange">
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
      </template>
    </div>
    <div class="border-l-2 ml-5">
      <div class="ml-5">
        <template v-for="child in tree?.children" :key="child.value">
          <template v-if="child.type === 'property'">
            <div :key="child.value" class="flex flex-col py-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ child.value }}</span>
              </div>
              <div class="ml-5">
                <template v-for="grandchild in child.children" :key="grandchild.value">
                  <TransformNode :tree="grandchild" />
                </template>
              </div>
            </div>
          </template>
          <template v-else>
            <TransformNode :tree="child">{{ child.value }}</TransformNode>
          </template>
        </template>
      </div>
    </div>
    <TransformNode v-for="sibling in tree?.siblings || []" :key="sibling.value" :tree="sibling">
      {{ sibling.value }}
    </TransformNode>
  </div>
</template>
