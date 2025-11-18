<script setup lang="ts">
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { type TabItemData, TABS_DESK_KEY } from '.';

/**
 * Tab Item Component
 *
 * Individual tab component that automatically checks in to the desk
 * and watches prop changes to keep the registry synchronized.
 */

const props = defineProps<{
  id: string | number;
  label: string;
  content: string;
  icon?: string;
  isActive: boolean;
  canClose: boolean;
}>();

const emit = defineEmits<{
  select: [id: string | number];
  close: [id: string | number];
}>();

// Automatically check in to the desk with data watching enabled
// This keeps the desk registry in sync with the component's props
useCheckIn<TabItemData>().checkIn(TABS_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: () => ({
    label: props.label,
    content: props.content,
    icon: props.icon,
  }),
});
</script>

<template>
  <div class="relative flex items-center gap-1 h-12">
    <UButton
      :leading-icon="props.icon"
      color="neutral"
      variant="ghost"
      class="rounded-t-md rounded-b-none whitespace-nowrap"
      @click="emit('select', props.id)"
    >
      {{ props.label }}
    </UButton>
    <UButton
      v-if="props.canClose"
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-heroicons-x-mark"
      @click="emit('close', props.id)"
    />
    <div v-if="props.isActive" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />
  </div>
</template>
