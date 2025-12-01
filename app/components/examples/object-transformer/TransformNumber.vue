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
  {
    name: 'Round',
    if: (node) => node.type === 'number',
    fn: (v: any) => Math.round(v),
  },
  {
    name: 'Ceil',
    if: (node) => node.type === 'number',
    fn: (v: any) => Math.ceil(v),
  },
  {
    name: 'Floor',
    if: (node) => node.type === 'number',
    fn: (v: any) => Math.floor(v),
  },
  {
    name: 'Absolute',
    if: (node) => node.type === 'number',
    fn: (v: any) => Math.abs(v),
  },
  {
    name: 'Negate',
    if: (node) => node.type === 'number',
    fn: (v: any) => -v,
  },
  {
    name: 'Power',
    if: (node) => node.type === 'number',
    params: [{ key: 'exponent', label: 'Exponent', type: 'number', default: 2 }],
    fn: (v: any, exponent: number) => Math.pow(v, exponent),
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
