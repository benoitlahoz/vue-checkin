<script setup lang="ts">
import { ref } from 'vue';
import { useCheckIn } from '#vue-airport';
import { TransformNode, TransformObjectDeskKey, type NodeObject, type NodeType } from '.';
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

const buildNodeTree = (value: any, nodeName: string = ''): NodeObject => {
  if (Array.isArray(value)) {
    return {
      value: nodeName,
      type: 'array',
      children: value.map((item, idx) => buildNodeTree(item, String(idx))),
    };
  } else if (value && typeof value === 'object') {
    return {
      value: nodeName,
      type: 'object',
      children: Object.keys(value).map((key) => buildNodeTree(value[key], key)),
    };
  } else {
    return {
      value,
      type: typeof value as NodeType,
      children: [],
    };
  }
};

const data = {
  name: 'john doe',
  age: 30,
  city: 'marseille',
  address: {
    street: '123 main st',
    zip: '13001',
  },
  hobbies: ['reading', 'traveling', 'swimming'],
};

const tree = ref<NodeObject>(buildNodeTree(data, 'Root'));

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
