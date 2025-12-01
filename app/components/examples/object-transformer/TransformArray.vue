<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import type { ObjectTransformerContext, Transform, StructuralTransformResult } from '.';
import { ObjectTransformerDeskKey } from '.';

type DeskWithContext = typeof desk & ObjectTransformerContext;

const transforms: Transform[] = [
  {
    name: 'To Object Properties',
    if: (node) => node.type === 'array',
    params: [{ key: 'removeSource', label: 'Remove source', type: 'boolean', default: false }],
    fn: (v: any[], removeSource: boolean): StructuralTransformResult => ({
      __structuralChange: true,
      action: 'arrayToProperties',
      parts: v,
      removeSource,
    }),
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
