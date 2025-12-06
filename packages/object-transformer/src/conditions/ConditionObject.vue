<script setup lang="ts">
import { onMounted } from 'vue';
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform } from '..';
import { ObjectTransformerDeskKey } from '..';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const { checkIn } = useCheckIn<Transform, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey, {
  id: 'object-conditions',
  autoCheckIn: true,
});

const deskWithContext = desk as DeskWithContext;

// Conditions are NON-structural transforms that return the value unchanged
// They use the 'condition' property to evaluate and set conditionMet metadata
const transforms: Transform[] = [
  {
    name: 'Is Empty',
    applicableTo: ['object'],
    params: [{ key: 'not', label: 'Not', type: 'boolean', default: false }],
    condition: (v: Record<string, any>, not = false) => {
      if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
      const result = Object.keys(v).length === 0;
      return not ? !result : result;
    },
    fn: (v: Record<string, any>) => v,
  },
  {
    name: 'Has Property',
    applicableTo: ['object'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'property', label: 'Property name', type: 'text', default: '' },
    ],
    condition: (v: Record<string, any>, not = false, property: string) => {
      if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
      if (!property || typeof property !== 'string') return false;
      const result = property in v;
      return not ? !result : result;
    },
    fn: (v: Record<string, any>) => v,
  },
  {
    name: 'Property Count Equals',
    applicableTo: ['object'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'count', label: 'Count', type: 'number', default: 0 },
    ],
    condition: (v: Record<string, any>, not = false, count: number) => {
      if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
      const result = Object.keys(v).length === count;
      return not ? !result : result;
    },
    fn: (v: Record<string, any>) => v,
  },
  {
    name: 'Property Count Greater Than',
    applicableTo: ['object'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'threshold', label: 'Threshold', type: 'number', default: 0 },
    ],
    condition: (v: Record<string, any>, not = false, threshold: number) => {
      if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
      const result = Object.keys(v).length > threshold;
      return not ? !result : result;
    },
    fn: (v: Record<string, any>) => v,
  },
  {
    name: 'Property Count Less Than',
    applicableTo: ['object'],
    params: [
      { key: 'not', label: 'Not', type: 'boolean', default: false },
      { key: 'threshold', label: 'Threshold', type: 'number', default: 10 },
    ],
    condition: (v: Record<string, any>, not = false, threshold: number) => {
      if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
      const result = Object.keys(v).length < threshold;
      return not ? !result : result;
    },
    fn: (v: Record<string, any>) => v,
  },
];

onMounted(() => {
  deskWithContext.addTransforms(...transforms);
});
</script>

<template>
  <div data-slot="condition-object" style="display: none">
    <!-- Conditions are registered via addTransforms in onMounted -->
  </div>
</template>
