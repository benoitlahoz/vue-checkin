<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform } from '.';
import { ObjectTransformerDeskKey } from '.';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const transforms: Transform[] = [
  {
    name: 'Negate',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => !v,
  },
  {
    name: 'To String',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => String(v),
  },
  {
    name: 'To Number',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => (v ? 1 : 0),
  },
  {
    name: 'To Yes/No',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => (v ? 'Yes' : 'No'),
  },
  {
    name: 'To On/Off',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => (v ? 'On' : 'Off'),
  },
];

const { checkIn } = useCheckIn<Transform, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey, {
  id: 'boolean-transform',
  autoCheckIn: true,
});

onMounted(() => {
  const d = desk as DeskWithContext;
  d.addTransforms(...transforms);
});
</script>

<template>
  <!-- Linter -->
  <div class="hidden"></div>
</template>
