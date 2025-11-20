<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { cn } from '@/lib/utils';
import { type ToolItemData, SLOTS_TOOLBAR_DESK_KEY, type SlotsToolbarContext } from '.';

export interface PluggableToolItemProps {
  id: string;
  zone?: string;
  class?: HTMLAttributes['class'];
}

const props = defineProps<PluggableToolItemProps>();

// Check in to the desk
const { checkIn } = useCheckIn<ToolItemData, SlotsToolbarContext>();
const { desk } = checkIn(SLOTS_TOOLBAR_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
});

// Classe du conteneur externe : itemClass du desk définit les dimensions (ex: aspect-square)
const containerClass = computed(() =>
  cn('flex h-full shrink-0 items-center justify-center', desk?.itemClass.value, props.class)
);

// Classe du wrapper interne : contraint le contenu du slot aux dimensions du conteneur
const contentClass = computed(
  () => 'flex h-full w-full max-h-full max-w-full items-center justify-center overflow-hidden'
);
</script>

<template>
  <div data-slot="pluggable-tool-item" :class="containerClass">
    <div :class="contentClass">
      <slot :desk="desk" />
    </div>
  </div>
</template>
