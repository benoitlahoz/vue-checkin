<script setup lang="ts">
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { type PluginItemData, PLUGIN_DESK_KEY } from '.';

/**
 * Plugin List Item Component
 *
 * Individual list item that automatically checks in to the desk
 * and watches prop changes for synchronization.
 */

const props = defineProps<{
  id: string | number;
  name: string;
  description: string;
  isActive: boolean;
}>();

const emit = defineEmits<{
  select: [id: string | number];
  remove: [id: string | number];
}>();

// Automatically check in to the desk with data watching enabled
useCheckIn<PluginItemData>().checkIn(PLUGIN_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: () => ({
    name: props.name,
    description: props.description,
  }),
});
</script>

<template>
  <li
    class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
    :class="{
      'bg-primary-50 dark:bg-primary-900/20 border-primary-500': props.isActive,
    }"
    @click="emit('select', props.id)"
  >
    <div class="flex flex-col gap-1">
      <strong>{{ props.name }}</strong>
      <span class="text-xs text-gray-600 dark:text-gray-400">ID: {{ props.id }}</span>
    </div>
    <UButton
      size="xs"
      color="error"
      variant="ghost"
      icon="i-heroicons-trash"
      @click.stop="emit('remove', props.id)"
    />
  </li>
</template>
