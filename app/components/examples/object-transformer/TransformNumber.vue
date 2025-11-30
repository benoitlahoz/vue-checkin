<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform } from '.';
import { ObjectTransformerDeskKey } from '.';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const transforms: Transform[] = [
  {
    name: 'Add',
    if: (node) => node.type === 'number',
    params: [{ key: 'amount', label: 'Amount', type: 'number', default: 1 }],
    fn: (v: any, amount: number) => v + amount,
  },
  {
    name: 'Subtract',
    if: (node) => node.type === 'number',
    params: [{ key: 'amount', label: 'Amount', type: 'number', default: 1 }],
    fn: (v: any, amount: number) => v - amount,
  },
  {
    name: 'Multiply',
    if: (node) => node.type === 'number',
    params: [{ key: 'factor', label: 'Factor', type: 'number', default: 2 }],
    fn: (v: any, factor: number) => v * factor,
  },
  {
    name: 'Divide',
    if: (node) => node.type === 'number',
    params: [{ key: 'divisor', label: 'Divisor', type: 'number', default: 2 }],
    fn: (v: any, divisor: number) => v / divisor,
  },
];

const { checkIn } = useCheckIn<Transform, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey, {
  id: 'number-transform',
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
