<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

export interface PluggableToolbarZoneProps {
  name: string;
  class?: HTMLAttributes['class'];
}

const props = defineProps<PluggableToolbarZoneProps>();

// Identifier ce composant comme une zone
defineOptions({
  __isToolbarZone: true,
});
</script>

<template>
  <div
    data-slot="pluggable-toolbar-zone"
    :data-zone-name="props.name"
    :class="cn('flex h-full items-center gap-1', props.class)"
  >
    <slot />
  </div>
</template>
