<script setup lang="ts">
import { onMounted } from 'vue';
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform } from '..';
import { ObjectTransformerDeskKey } from '..';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const { checkIn } = useCheckIn<Transform, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey, {
  id: 'array-conditions',
  autoCheckIn: true,
});

const deskWithContext = desk as DeskWithContext;

// Conditions are NON-structural transforms that return the value unchanged
// They use the 'condition' property to evaluate and set conditionMet metadata
const transforms: Transform[] = [
  {
    name: 'Is Empty',
    applicableTo: ['array'],
    params: [{ key: 'not', label: 'Not', type: 'boolean', default: false }],
    condition: (v: any[], not = false) => {
      if (!Array.isArray(v)) return false;
      const result = v.length === 0;
      return not ? !result : result;
    },
    fn: (v: any[]) => v,
  },
  {
    name: 'Length Equals',
    applicableTo: ['array'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'length', label: 'Length', type: 'number', default: 0 },
    ],
    condition: (v: any[], not = false, length: number) => {
      if (!Array.isArray(v)) return false;
      const result = v.length === length;
      return not ? !result : result;
    },
    fn: (v: any[]) => v,
  },
  {
    name: 'Length Greater Than',
    applicableTo: ['array'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'threshold', label: 'Threshold', type: 'number', default: 0 },
    ],
    condition: (v: any[], not = false, threshold: number) => {
      if (!Array.isArray(v)) return false;
      const result = v.length > threshold;
      return not ? !result : result;
    },
    fn: (v: any[]) => v,
  },
  {
    name: 'Length Less Than',
    applicableTo: ['array'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'threshold', label: 'Threshold', type: 'number', default: 10 },
    ],
    condition: (v: any[], not = false, threshold: number) => {
      if (!Array.isArray(v)) return false;
      const result = v.length < threshold;
      return not ? !result : result;
    },
    fn: (v: any[]) => v,
  },
  {
    name: 'Contains',
    applicableTo: ['array'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'value', label: 'Value', type: 'text', default: '' },
    ],
    condition: (v: any[], not = false, value: any) => {
      if (!Array.isArray(v)) return false;
      const result = v.includes(value);
      return not ? !result : result;
    },
    fn: (v: any[]) => v,
  },
  {
    name: 'All Items Same Type',
    applicableTo: ['array'],
    params: [{ key: 'not', label: 'Not', type: 'boolean', default: false }],
    condition: (v: any[], not = false) => {
      if (!Array.isArray(v) || v.length === 0) return false;
      const firstType = typeof v[0];
      const result = v.every((item) => typeof item === firstType);
      return not ? !result : result;
    },
    fn: (v: any[]) => v,
  },
];

onMounted(() => {
  deskWithContext.addTransforms(...transforms);
});
</script>

<template>
  <div data-slot="condition-array" style="display: none">
    <!-- Conditions are registered via addTransforms in onMounted -->
  </div>
</template>
