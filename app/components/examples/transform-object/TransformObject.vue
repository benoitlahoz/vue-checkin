<script setup lang="ts">
import { ref } from 'vue';
import { useCheckIn } from '#vue-airport';
import { TransformNode, TransformObjectDeskKey, type NodeObject, type NodeType } from '.';
/*
const buildNodeTree = (value: any, nodeName: string = '', parent?: NodeObject): NodeObject => {
  if (Array.isArray(value)) {
    const node: NodeObject = {
      value: nodeName,
      type: 'array',
      parent,
    };
    return {
      ...node,
      children: value.map((item, index) => buildNodeTree(item, index.toString(), node)),
    };
  } else if (value && typeof value === 'object' && !Array.isArray(value)) {
    const node: NodeObject = {
      value: nodeName,
      type: 'object',
      parent,
    };
    return {
      ...node,
      children: Object.keys(value).map((key) => buildNodeTree(value[key], key, node)),
    };
  } else {
    const isInArray = parent?.type === 'array';
    const isIndex = !isNaN(Number(nodeName)) && nodeName !== '';
    if (isInArray && isIndex) {
      const node = {
        value: nodeName,
        type: 'index',
        parent,
      };
      return {
        ...node,
        children: [
          {
            value,
            type: typeof value as NodeType,
            children: [],
            parent: node,
          },
        ],
      };
    } else {
      const node = {
        value: nodeName,
        type: 'property',
        parent,
      };
      return {
        ...node,
        children: [
          {
            value,
            type: typeof value as NodeType,
            children: [],
            parent,
          },
        ],
      };
    }
  }
};
*/

function buildNodeTree(value: any, key?: string, parent?: NodeObject): NodeObject {
  if (Array.isArray(value)) {
    const node: NodeObject = {
      type: 'array',
      key,
      initialValue: [],
      transforms: [],
      children: [],
      parent,
    };

    node.children = value.map((item, index) => buildNodeTree(item, String(index), node));

    // Construire la valeur initiale à partir des enfants
    node.initialValue = node.children.map((c) => c.initialValue);

    return node;
  } else if (value !== null && typeof value === 'object') {
    const node: NodeObject = {
      type: 'object',
      key,
      initialValue: {},
      transforms: [],
      children: [],
      parent,
    };

    node.children = Object.entries(value).map(([k, v]) => buildNodeTree(v, k, node));

    // Construire la valeur initiale à partir des enfants
    node.initialValue = node.children.reduce(
      (acc, c) => {
        acc[c.key!] = c.initialValue;
        return acc;
      },
      {} as Record<string, any>
    );

    return node;
  } else {
    // primitive
    const type: NodeType =
      typeof value === 'string'
        ? 'string'
        : typeof value === 'number'
          ? 'number'
          : typeof value === 'boolean'
            ? 'boolean'
            : value === null
              ? 'null'
              : 'undefined';

    return {
      type,
      key,
      initialValue: value,
      transforms: [],
      parent,
    };
  }
}

const data = {
  name: 'john doe',
  age: 30,
  city: 'marseille',
  address: {
    street: '123 main st',
    zip: '13001',
    custom: {
      info: 'some custom info',
      tags: ['tag1', 'tag2'],
    },
  },
  hobbies: ['reading', 'traveling', 'swimming'],
};

const tree = ref<NodeObject>(buildNodeTree(data, 'Root'));

// console.log('Tree:', tree.value);

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
