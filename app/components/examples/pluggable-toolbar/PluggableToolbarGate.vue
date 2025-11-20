<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

export interface PluggableToolbarGateProps {
  name: string;
  class?: HTMLAttributes['class'];
}

const props = defineProps<PluggableToolbarGateProps>();

defineOptions({
  __isToolbarGate: true,
});
</script>

<template>
  <div
    data-slot="pluggable-toolbar-gate"
    :data-gate-name="props.name"
    :class="cn('flex h-full items-center gap-1', props.class)"
  >
    <slot />
  </div>
</template>
