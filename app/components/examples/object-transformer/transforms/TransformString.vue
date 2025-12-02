<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform } from '..';
import { ObjectTransformerDeskKey, registerStructuralTransformHandler } from '..';

type DeskWithContext = typeof desk & ObjectTransformerContext;

// Register structural transform handler for 'split'
registerStructuralTransformHandler('split', (current, lastKey, result) => {
  if (!Array.isArray(result.parts)) return;

  // Create new properties from parts
  result.parts.forEach((part: any, index: number) => {
    const newKey = `${lastKey}_${index}`;
    current[newKey] = part;
  });

  // Remove source if specified
  if (result.removeSource) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete current[lastKey];
  }
});

// Register structural transform handler for 'stringToObject'
registerStructuralTransformHandler('stringToObject', (current, lastKey, result) => {
  if (!result.object) return;

  // Create multiple properties from the object
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
    name: 'Split',
    structural: true, // This is a structural transform
    if: (node) => node.type === 'string',
    params: [{ key: 'delimiter', label: 'Delimiter', type: 'text', default: ' ' }],
    fn: (v: string, delimiter: string) => ({
      __structuralChange: true,
      action: 'split' as const,
      parts: v.split(delimiter),
      removeSource: false,
    }),
  },
  { name: 'Uppercase', if: (node) => node.type === 'string', fn: (v: any) => v.toUpperCase() },
  { name: 'Lowercase', if: (node) => node.type === 'string', fn: (v: any) => v.toLowerCase() },
  {
    name: 'Capitalized',
    if: (node) => node.type === 'string',
    fn: (v: any) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
  },
  {
    name: 'Replace',
    if: (n) => n.type === 'string',
    params: [
      { key: 'search', label: 'Search', type: 'text', default: '' },
      { key: 'replace', label: 'Replace', type: 'text', default: '' },
    ],
    fn: (v: string, s: string, r: string) => v.replaceAll(s, r),
  },
  {
    name: 'Trim',
    if: (node) => node.type === 'string',
    fn: (v: any) => v.trim(),
  },
  {
    name: 'Append',
    if: (node) => node.type === 'string',
    params: [{ key: 'suffix', label: 'Suffix', type: 'text', default: '' }],
    fn: (v: string, s: string) => v + s,
  },
  {
    name: 'Prepend',
    if: (node) => node.type === 'string',
    params: [{ key: 'prefix', label: 'Prefix', type: 'text', default: '' }],
    fn: (v: string, p: string) => p + v,
  },
  {
    name: 'Substring',
    if: (node) => node.type === 'string',
    params: [
      { key: 'start', label: 'Start Index', type: 'number', default: 0 },
      { key: 'end', label: 'End Index', type: 'number', default: undefined },
    ],
    fn: (v: string, start: number, end?: number) => v.substring(start, end),
  },
  {
    name: 'Repeat',
    if: (node) => node.type === 'string',
    params: [{ key: 'count', label: 'Count', type: 'number', default: 1 }],
    fn: (v: string, count: number) => v.repeat(count),
  },
  {
    name: 'Remove Spaces',
    if: (node) => node.type === 'string',
    fn: (v: string) => v.replace(/\s+/g, ''),
  },
  {
    name: 'Remove Multiple Spaces',
    if: (node) => node.type === 'string',
    fn: (v: string) => v.replace(/\s+/g, ' '),
  },
  {
    name: 'Reverse',
    if: (node) => node.type === 'string',
    fn: (v: string) => v.split('').reverse().join(''),
  },
  {
    name: 'To Number',
    if: (node) => node.type === 'string',
    fn: (v: string) => {
      return Number(v);
    },
  },
  {
    name: 'To Object',
    structural: true,
    if: (node) => node.type === 'string',
    fn: (v: string) => ({
      __structuralChange: true,
      action: 'stringToObject' as const,
      object: {
        object: { name: v },
      },
      removeSource: false,
    }),
  },
];

const { checkIn } = useCheckIn<Transform, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey, {
  id: 'string-transform',
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
