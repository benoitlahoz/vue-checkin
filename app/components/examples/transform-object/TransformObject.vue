<script setup lang="ts">
import { ref } from 'vue';
import { useCheckIn } from '#vue-airport';
import { TransformNode, TransformObjectDeskKey, type NodeObject } from '.';
/*
const tree: NodeObject = ref({
  value: 'Root',
  children: [
    {
      value: 'Child 1',
      children: [
        {
          value: 'Grandchild 1',
          children: [],
        },
        {
          value: 'Grandchild 2',
          children: [],
        },
      ],
      siblings: [
        {
          value: 'Sibling 1',
          children: [],
        },
        {
          value: 'Sibling 2',
          children: [],
        },
      ],
    },
    {
      value: 'Child 2',
      children: [
        {
          value: 'Grandchild 1',
          children: ['Great Grandchild 1', 'Great Grandchild 2'].map((v) => ({
            value: v,
            children: [],
          })),
        },
      ],
    },
  ],
});
*/

const data = {
  name: 'john doe',
  age: 30,
  city: 'marseille',
};

const tree = ref<NodeObject>({
  value: 'Root',
  type: 'object',
  children: Object.keys(data).map((key) => ({
    value: key,
    type: 'property',
    children: [
      {
        value: `${data[key as keyof typeof data]}`,
        type: typeof data[key as keyof typeof data] as
          | 'string'
          | 'number'
          | 'boolean'
          | 'object'
          | 'array',
        children: [],
      },
    ],
  })),
});

const { createDesk } = useCheckIn<NodeObject>();
createDesk(TransformObjectDeskKey, {
  devTools: true,
});
</script>

<template>
  <div>
    <TransformNode :tree="tree" />
  </div>
</template>

<style scoped></style>
