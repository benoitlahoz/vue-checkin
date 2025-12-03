<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform, StructuralTransformResult } from '..';
import { ObjectTransformerDeskKey, registerStructuralTransformHandler } from '..';

type DeskWithContext = typeof desk & ObjectTransformerContext;

// Register structural transform handler for 'arrayToProperties'
registerStructuralTransformHandler('arrayToProperties', (current, lastKey, result) => {
  if (!result.object) return;

  // Create new properties from the object (same pattern as stringToObject)
  Object.entries(result.object).forEach(([key, value]) => {
    const newKey = `${lastKey}_${key}`;
    current[newKey] = value;
  });

  // Remove source if specified
  if (result.removeSource) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete current[lastKey];
  }
});

const transforms: Transform[] = [
  {
    name: 'Join',
    if: (node) => node.type === 'array',
    params: [{ key: 'separator', label: 'Separator', type: 'string', default: ', ' }],
    fn: (v: any[], separator: string) => {
      if (!Array.isArray(v)) return v;
      const sep = typeof separator === 'string' ? separator : ', ';
      return v.join(sep);
    },
  },
  {
    name: 'Unique',
    if: (node) => node.type === 'array',
    fn: (v: any[]) => {
      if (!Array.isArray(v)) return v;
      return Array.from(new Set(v));
    },
  },
  {
    name: 'Filter Nulls',
    if: (node) => node.type === 'array',
    fn: (v: any[]) => {
      if (!Array.isArray(v)) return v;
      return v.filter((item) => item != null);
    },
  },
  {
    name: 'Filter Undefined',
    if: (node) => node.type === 'array',
    fn: (v: any[]) => {
      if (!Array.isArray(v)) return v;
      return v.filter((item) => item !== undefined);
    },
  },
  {
    name: 'Filter By Value',
    if: (node) => node.type === 'array',
    params: [{ key: 'value', label: 'Value', type: 'text', default: '' }],
    fn: (v: any[], value: any) => {
      if (!Array.isArray(v)) return v;
      return v.filter((item) => item === value);
    },
  },
  {
    name: 'To Object',
    structural: true, // This is a structural transform
    if: (node) => node.type === 'array',
    fn: (v: any[]): StructuralTransformResult => {
      if (!Array.isArray(v)) return v as any;

      // Convert array to object with indexed keys
      const obj: Record<string, any> = {};
      v.forEach((part: any, index: number) => {
        obj[index.toString()] = part;
      });

      return {
        __structuralChange: true,
        action: 'arrayToProperties',
        object: {
          object: obj,
        },
        removeSource: false,
      };
    },
  },
  {
    name: 'To String',
    if: (node) => node.type === 'array',
    fn: (v: any) => {
      if (!Array.isArray(v)) return v;
      return JSON.stringify(v);
    },
  },
];

const { checkIn } = useCheckIn<Transform, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey, {
  id: 'array-transform',
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
