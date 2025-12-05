<script setup lang="ts">
import { onMounted } from 'vue';
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform } from '..';
import { ObjectTransformerDeskKey, registerStructuralTransformHandler } from '..';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const { checkIn } = useCheckIn<Transform, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey, {
  id: 'string-transform',
  autoCheckIn: true,
});

const transforms: Transform[] = [
  {
    name: 'Split',
    structural: true, // This is a structural transform
    if: (node) => node.type === 'string',
    params: [{ key: 'delimiter', label: 'Delimiter', type: 'text', default: ' ' }],
    fn: (v: string, delimiter: string) => {
      if (typeof delimiter !== 'string') delimiter = ' ';
      return {
        __structuralChange: true,
        action: 'split' as const,
        parts: v.split(delimiter),
        removeSource: false,
      };
    },
  },
  {
    name: 'Uppercase',
    if: (node) => node.type === 'string',
    fn: (v: any) => (typeof v === 'string' ? v.toUpperCase() : v),
  },
  {
    name: 'Lowercase',
    if: (node) => node.type === 'string',
    fn: (v: any) => (typeof v === 'string' ? v.toLowerCase() : v),
  },
  {
    name: 'Capitalized',
    if: (node) => node.type === 'string',
    fn: (v: any) =>
      typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : v,
  },
  {
    name: 'Replace',
    if: (n) => n.type === 'string',
    params: [
      { key: 'search', label: 'Search', type: 'text', default: '' },
      { key: 'replace', label: 'Replace', type: 'text', default: '' },
    ],
    fn: (v: string, s: string, r: string) => {
      if (typeof s !== 'string') s = '';
      if (typeof r !== 'string') r = '';
      // replaceAll may not be supported in older lib targets; use split/join for compatibility
      if (s === '') return v; // avoid infinite loop
      return v.split(s).join(r);
    },
  },
  {
    name: 'Trim',
    if: (node) => node.type === 'string',
    fn: (v: any) => (typeof v === 'string' ? v.trim() : v),
  },
  {
    name: 'Append',
    if: (node) => node.type === 'string',
    params: [{ key: 'suffix', label: 'Suffix', type: 'text', default: '' }],
    fn: (v: string, s: string) => {
      if (typeof s !== 'string') s = '';
      return v + s;
    },
  },
  {
    name: 'Prepend',
    if: (node) => node.type === 'string',
    params: [{ key: 'prefix', label: 'Prefix', type: 'text', default: '' }],
    fn: (v: string, p: string) => {
      if (typeof p !== 'string') p = '';
      return p + v;
    },
  },
  {
    name: 'Substring',
    if: (node) => node.type === 'string',
    params: [
      { key: 'start', label: 'Start Index', type: 'number', default: 0 },
      { key: 'end', label: 'End Index', type: 'number', default: undefined },
    ],
    fn: (v: string, start: number, end?: number) => {
      const startIdx = typeof start === 'number' ? start : 0;
      const endIdx = typeof end === 'number' ? end : undefined;
      return v.substring(startIdx, endIdx);
    },
  },
  {
    name: 'Repeat',
    if: (node) => node.type === 'string',
    params: [{ key: 'count', label: 'Count', type: 'number', default: 1 }],
    fn: (v: string, count: number) => {
      const repeatCount = typeof count === 'number' && count > 0 ? Math.floor(count) : 1;
      return v.repeat(repeatCount);
    },
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
      if (typeof v !== 'string') return v;
      return Number(v); // Always return number, even if NaN
    },
  },
  {
    name: 'To Object',
    structural: true,
    if: (node) => node.type === 'string',
    fn: (v: any) => {
      // Accept any value type after intermediate transformations
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

onMounted(() => {
  const d = desk as DeskWithContext;
  if (!d) return;

  // Register structural transform handler for 'split'
  registerStructuralTransformHandler(
    'split',
    (current, lastKey, result) => {
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
    },
    d
  );

  d.addTransforms(...transforms);
});
</script>

<template>
  <div class="hidden"></div>
</template>
