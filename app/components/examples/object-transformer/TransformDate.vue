<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform } from '.';
import { ObjectTransformerDeskKey } from '.';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const transforms: Transform[] = [
  {
    name: 'To ISO String',
    if: (node) => node.type === 'date',
    fn: (v: any) => (v instanceof Date ? v.toISOString() : v),
  },
  {
    name: 'To Locale Date String',
    if: (node) => node.type === 'date',
    fn: (v: any) => (v instanceof Date ? v.toLocaleDateString() : v),
  },
  {
    name: 'To Locale Time String',
    if: (node) => node.type === 'date',
    fn: (v: any) => (v instanceof Date ? v.toLocaleTimeString() : v),
  },
  {
    name: 'Add Days',
    if: (node) => node.type === 'date',
    params: [{ key: 'days', label: 'Days', type: 'number', default: 1 }],
    fn: (v: any, days: number) => {
      if (!(v instanceof Date)) return v;
      const date = new Date(v);
      date.setDate(date.getDate() + days);
      return date;
    },
  },
  {
    name: 'Subtract Days',
    if: (node) => node.type === 'date',
    params: [{ key: 'days', label: 'Days', type: 'number', default: 1 }],
    fn: (v: any, days: number) => {
      if (!(v instanceof Date)) return v;
      const date = new Date(v);
      date.setDate(date.getDate() - days);
      return date;
    },
  },
];

const { checkIn } = useCheckIn<Transform, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey, {
  id: 'date-transform',
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
