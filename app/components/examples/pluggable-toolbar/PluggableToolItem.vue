<script setup lang="ts">
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { cn } from '@/lib/utils';
import { type ToolItemData, SLOTS_TOOLBAR_DESK_KEY, type SlotsToolbarContext } from '.';

export interface PluggableToolItemProps {
  id: string;
  zone?: string;
}

const props = defineProps<PluggableToolItemProps>();

// Check in to the desk
const { checkIn } = useCheckIn<ToolItemData, SlotsToolbarContext>();
const { desk } = checkIn(SLOTS_TOOLBAR_DESK_KEY, {
  id: props.id,
  autoCheckIn: true, // Auto check-in when condition in `watchCondition` is met
  watchData: true,
  watchCondition: (desk) => {
    // Check if the zone is allowed
    if (!props.zone) return true; // No zone = always allowed
    if (!desk) return false; // No desk = not allowed
    return desk.zones.includes(props.zone);
  },
});

// Compute container class
const containerClass = computed(() =>
  cn('flex items-center justify-center overflow-hidden', desk?.itemClass.value)
);

defineOptions({
  __isToolbarItem: true,
});
</script>

<template>
  <div data-slot="pluggable-tool-item" :class="containerClass">
    <slot :desk="desk" />
  </div>
</template>
