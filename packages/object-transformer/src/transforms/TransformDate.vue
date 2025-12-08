<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import { onMounted } from 'vue';
import type { ObjectTransformerContext, Transform } from '..';
import { ObjectTransformerDeskKey } from '..';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const transforms: Transform[] = [
  {
    name: 'To ISO String',
    applicableTo: ['date'],
    fn: (v: any) => (v instanceof Date ? v.toISOString() : v),
  },
  {
    name: 'To Locale Date String',
    applicableTo: ['date'],
    fn: (v: any) => (v instanceof Date ? v.toLocaleDateString() : v),
  },
  {
    name: 'To Locale Time String',
    applicableTo: ['date'],
    fn: (v: any) => (v instanceof Date ? v.toLocaleTimeString() : v),
  },
  {
    name: 'Add Days',
    applicableTo: ['date'],
    params: [{ key: 'days', label: 'Days', type: 'number', default: 1 }],
    fn: (v: any, days: number) => {
      if (!(v instanceof Date)) return v;
      const daysToAdd = typeof days === 'number' ? days : 1;
      const date = new Date(v);
      date.setDate(date.getDate() + daysToAdd);
      return date;
    },
  },
  {
    name: 'Subtract Days',
    applicableTo: ['date'],
    params: [{ key: 'days', label: 'Days', type: 'number', default: 1 }],
    fn: (v: any, days: number) => {
      if (!(v instanceof Date)) return v;
      const daysToSubtract = typeof days === 'number' ? days : 1;
      const date = new Date(v);
      date.setDate(date.getDate() - daysToSubtract);
      return date;
    },
  },
  {
    name: 'Get Time',
    applicableTo: ['date'],
    fn: (v: any) => (v instanceof Date ? v.getTime() : v),
  },
  {
    name: 'Get Year',
    applicableTo: ['date'],
    fn: (v: any) => (v instanceof Date ? v.getFullYear() : v),
  },
  {
    name: 'Get Month',
    applicableTo: ['date'],
    fn: (v: any) => (v instanceof Date ? v.getMonth() + 1 : v), // Months are zero-based
  },
  {
    name: 'Get Day',
    applicableTo: ['date'],
    fn: (v: any) => (v instanceof Date ? v.getDate() : v), // Day of the month
  },
  {
    name: 'To Object',
    structural: true,
    applicableTo: ['date'],
    params: [
      {
        key: 'removeSource',
        label: 'Remove source',
        type: 'boolean',
        default: true,
      },
    ],
    fn: (v: any, removeSource: boolean = true) => {
      // Accept any value type after intermediate transformations
      // Wrap any value in an object structure
      return {
        __structuralChange: true,
        action: 'toObject' as const,
        object: {
          object: { value: v },
        },
        removeSource,
      };
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
  <div class="hidden"></div>
</template>
