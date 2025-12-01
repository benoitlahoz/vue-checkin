<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform } from '.';
import { ObjectTransformerDeskKey } from '.';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const transforms: Transform[] = [
  {
    name: 'Split',
    if: (node) => node.type === 'string',
    params: [{ key: 'delimiter', label: 'Delimiter', type: 'text', default: ' ' }],
    fn: (v: string, delimiter: string) => ({
      __structuralChange: true,
      action: 'split' as const,
      parts: v.split(delimiter),
      removeSource: false,
    }),
  },
  { name: 'To Uppercase', if: (node) => node.type === 'string', fn: (v: any) => v.toUpperCase() },
  { name: 'To Lowercase', if: (node) => node.type === 'string', fn: (v: any) => v.toLowerCase() },
  {
    name: 'To Capitalized',
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
