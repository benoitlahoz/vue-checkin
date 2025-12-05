<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import { onMounted } from 'vue';
import type { ObjectTransformerContext, Transform } from '..';
import { ObjectTransformerDeskKey } from '..';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const transforms: Transform[] = [
  {
    name: 'Add',
    if: (node) => node.type === 'number',
    params: [{ key: 'amount', label: 'Amount', type: 'number', default: 1 }],
    fn: (v: any, amount: number) => {
      if (typeof v !== 'number') return v;
      const amt = typeof amount === 'number' ? amount : 1;
      return v + amt;
    },
  },
  {
    name: 'Subtract',
    if: (node) => node.type === 'number',
    params: [{ key: 'amount', label: 'Amount', type: 'number', default: 1 }],
    fn: (v: any, amount: number) => {
      if (typeof v !== 'number') return v;
      const amt = typeof amount === 'number' ? amount : 1;
      return v - amt;
    },
  },
  {
    name: 'Multiply',
    if: (node) => node.type === 'number',
    params: [{ key: 'factor', label: 'Factor', type: 'number', default: 2 }],
    fn: (v: any, factor: number) => {
      if (typeof v !== 'number') return v;
      const f = typeof factor === 'number' ? factor : 2;
      return v * f;
    },
  },
  {
    name: 'Divide',
    if: (node) => node.type === 'number',
    params: [{ key: 'divisor', label: 'Divisor', type: 'number', default: 2 }],
    fn: (v: any, divisor: number) => {
      if (typeof v !== 'number') return v;
      const d = typeof divisor === 'number' && divisor !== 0 ? divisor : 2;
      return v / d;
    },
  },
  {
    name: 'Round',
    if: (node) => node.type === 'number',
    fn: (v: any) => (typeof v === 'number' ? Math.round(v) : v),
  },
  {
    name: 'Ceil',
    if: (node) => node.type === 'number',
    fn: (v: any) => (typeof v === 'number' ? Math.ceil(v) : v),
  },
  {
    name: 'Floor',
    if: (node) => node.type === 'number',
    fn: (v: any) => (typeof v === 'number' ? Math.floor(v) : v),
  },
  {
    name: 'Absolute',
    if: (node) => node.type === 'number',
    fn: (v: any) => (typeof v === 'number' ? Math.abs(v) : v),
  },
  {
    name: 'Negate',
    if: (node) => node.type === 'number',
    fn: (v: any) => (typeof v === 'number' ? -v : v),
  },
  {
    name: 'Power',
    if: (node) => node.type === 'number',
    params: [{ key: 'exponent', label: 'Exponent', type: 'number', default: 2 }],
    fn: (v: any, exponent: number) => {
      if (typeof v !== 'number') return v;
      const exp = typeof exponent === 'number' ? exponent : 2;
      return Math.pow(v, exp);
    },
  },
  {
    name: 'Modulo',
    if: (node) => node.type === 'number',
    params: [{ key: 'modulus', label: 'Modulus', type: 'number', default: 2 }],
    fn: (v: any, modulus: number) => {
      if (typeof v !== 'number') return v;
      const mod = typeof modulus === 'number' && modulus !== 0 ? modulus : 2;
      return v % mod;
    },
  },
  {
    name: 'To Date',
    if: (node) => node.type === 'number',
    fn: (v: any) => (typeof v === 'number' ? new Date(v) : v),
  },
  {
    name: 'To String',
    if: (node) => node.type === 'number',
    fn: (v: any) => {
      // Safety check: convert numbers with proper formatting
      if (typeof v !== 'number') {
        return String(v); // Fallback to standard String conversion
      }
      return String(v);
    },
  },
  {
    name: 'To Object',
    structural: true,
    if: (node) => node.type === 'number',
    fn: (v: any) => {
      // Accept any value type after intermediate transformations
      // Wrap any value in an object structure
      return {
        __structuralChange: true,
        action: 'toObject' as const,
        object: {
          object: { value: v },
        },
        removeSource: false,
      };
    },
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
  <div class="hidden"></div>
</template>
