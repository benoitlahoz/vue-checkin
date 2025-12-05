<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import { onMounted } from 'vue';
import type { ObjectTransformerContext, Transform } from '..';
import { ObjectTransformerDeskKey } from '..';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const transforms: Transform[] = [
  {
    name: 'Negate',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => {
      return !v;
    },
  },
  {
    name: 'To String',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => {
      // Safety check: only convert booleans with specific formatting
      if (typeof v !== 'boolean') {
        return String(v); // Fallback to standard String conversion
      }
      return String(v);
    },
  },
  {
    name: 'To Number',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => {
      // Safety check: only convert booleans
      if (typeof v !== 'boolean') {
        return Number(v); // Fallback to standard Number conversion for non-booleans
      }
      return v ? 1 : 0;
    },
  },
  {
    name: 'To Yes/No',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => {
      return v ? 'Yes' : 'No';
    },
  },
  {
    name: 'To On/Off',
    if: (node) => node.type === 'boolean',
    fn: (v: boolean) => {
      return v ? 'On' : 'Off';
    },
  },
  {
    name: 'To Object',
    structural: true,
    if: (node) => node.type === 'boolean',
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
  id: 'boolean-transform',
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
