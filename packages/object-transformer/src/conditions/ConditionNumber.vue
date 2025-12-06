<script setup lang="ts">
import { onMounted } from 'vue';
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform } from '..';
import { ObjectTransformerDeskKey } from '..';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const { checkIn } = useCheckIn<Transform, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey, {
  id: 'number-conditions',
  autoCheckIn: true,
});

const deskWithContext = desk as DeskWithContext;

// Conditions are NON-structural transforms that return the value unchanged
// They use the 'condition' property to evaluate and set conditionMet metadata
const transforms: Transform[] = [
  {
    name: 'Is Even',
    applicableTo: ['number'],
    params: [{ key: 'not', label: 'Not', type: 'boolean', default: false }],
    condition: (v: number, not = false) => {
      if (typeof v !== 'number') return false;
      const result = v % 2 === 0;
      return not ? !result : result;
    },
    fn: (v: number) => v,
  },
  {
    name: 'Is Odd',
    applicableTo: ['number'],
    params: [{ key: 'not', label: 'Not', type: 'boolean', default: false }],
    condition: (v: number, not = false) => {
      if (typeof v !== 'number') return false;
      const result = v % 2 !== 0;
      return not ? !result : result;
    },
    fn: (v: number) => v,
  },
  {
    name: 'In Range',
    applicableTo: ['number'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'min', label: 'Min', type: 'number', default: 0 },
      { key: 'max', label: 'Max', type: 'number', default: 100 },
    ],
    condition: (v: number, not = false, min: number, max: number) => {
      if (typeof v !== 'number') return false;
      const result = v >= min && v <= max;
      return not ? !result : result;
    },
    fn: (v: number) => v,
  },
  {
    name: 'Greater Than',
    applicableTo: ['number'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'threshold', label: 'Threshold', type: 'number', default: 0 },
    ],
    condition: (v: number, not = false, threshold: number) => {
      if (typeof v !== 'number') return false;
      const result = v > threshold;
      return not ? !result : result;
    },
    fn: (v: number) => v,
  },
  {
    name: 'Less Than',
    applicableTo: ['number'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'threshold', label: 'Threshold', type: 'number', default: 0 },
    ],
    condition: (v: number, not = false, threshold: number) => {
      if (typeof v !== 'number') return false;
      const result = v < threshold;
      return not ? !result : result;
    },
    fn: (v: number) => v,
  },
  {
    name: 'Divisible By',
    applicableTo: ['number'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'divisor', label: 'Divisor', type: 'number', default: 2 },
    ],
    condition: (v: number, not = false, divisor: number) => {
      if (typeof v !== 'number' || divisor === 0) return false;
      const result = v % divisor === 0;
      return not ? !result : result;
    },
    fn: (v: number) => v,
  },
  {
    name: 'Is Positive',
    applicableTo: ['number'],
    params: [{ key: 'not', label: 'Not', type: 'boolean', default: false }],
    condition: (v: number, not = false) => {
      if (typeof v !== 'number') return false;
      const result = v > 0;
      return not ? !result : result;
    },
    fn: (v: number) => v,
  },
  {
    name: 'Is Negative',
    applicableTo: ['number'],
    params: [{ key: 'not', label: 'Not', type: 'boolean', default: false }],
    condition: (v: number, not = false) => {
      if (typeof v !== 'number') return false;
      const result = v < 0;
      return not ? !result : result;
    },
    fn: (v: number) => v,
  },
  {
    name: 'Is Integer',
    applicableTo: ['number'],
    params: [{ key: 'not', label: 'Not', type: 'boolean', default: false }],
    condition: (v: number, not = false) => {
      if (typeof v !== 'number') return false;
      const result = Number.isInteger(v);
      return not ? !result : result;
    },
    fn: (v: number) => v,
  },
];

onMounted(() => {
  deskWithContext.addTransforms(...transforms);
});
</script>

<template>
  <div data-slot="condition-number" style="display: none">
    <!-- Conditions are registered via addTransforms in onMounted -->
  </div>
</template>
