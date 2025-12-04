<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import { onMounted } from 'vue';
import type { ObjectTransformerContext, Transform } from '..';
import { ObjectTransformerDeskKey } from '..';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const transforms: Transform[] = [
  {
    name: 'Pick Keys',
    if: (node) => node.type === 'object',
    params: [{ key: 'keys', label: 'Keys (comma-separated)', type: 'text', default: '' }],
    fn: (v: any, keys: string) => {
      if (typeof v !== 'object' || v === null) return v;
      const k = typeof keys === 'string' ? keys.split(',').map((s) => s.trim()) : [];
      if (k.length === 0) return v;
      return k.reduce((acc: any, key) => {
        if (key in v) acc[key] = v[key];
        return acc;
      }, {});
    },
  },
  {
    name: 'Omit Keys',
    if: (node) => node.type === 'object',
    params: [{ key: 'keys', label: 'Keys (comma-separated)', type: 'text', default: '' }],
    fn: (v: any, keys: string) => {
      if (typeof v !== 'object' || v === null) return v;
      const k = typeof keys === 'string' ? keys.split(',').map((s) => s.trim()) : [];
      const res: any = { ...v };
      k.forEach((key) => delete res[key]);
      return res;
    },
  },
  {
    name: 'To String',
    if: (node) => node.type === 'object',
    fn: (v: any) => {
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    },
  },
];

const { checkIn } = useCheckIn<Transform, ObjectTransformerContext>();
const { desk } = checkIn(ObjectTransformerDeskKey, {
  id: 'object-transform',
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
