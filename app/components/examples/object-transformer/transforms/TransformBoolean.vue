<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform } from '..';
import { ObjectTransformerDeskKey } from '..';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const transforms: Transform[] = [
  {
    name: 'Negate',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => {
      if (typeof v !== 'boolean') return v;
      return !v;
    },
  },
  {
    name: 'To String',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => {
      if (typeof v !== 'boolean') return v;
      return String(v);
    },
  },
  {
    name: 'To Number',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => {
      if (typeof v !== 'boolean') return v;
      return v ? 1 : 0;
    },
  },
  {
    name: 'To Yes/No',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => {
      if (typeof v !== 'boolean') return v;
      return v ? 'Yes' : 'No';
    },
  },
  {
    name: 'To On/Off',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => {
      if (typeof v !== 'boolean') return v;
      return v ? 'On' : 'Off';
    },
  },
  {
    name: 'To Object',
    structural: true,
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => {
      const boolValue = typeof v === 'string' ? v === 'true' : v;
      if (typeof boolValue !== 'boolean') return v;

      return {
        __structuralChange: true,
        action: 'toObject' as const,
        object: {
          object: { value: boolValue },
        },
        removeSource: false,
      };
    },
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
