<script setup lang="ts">
import { useCheckIn } from 'vue-airport';
import {
  type DeskWithPlugins,
  type PluginItemContext,
  type PluginItemData,
  PLUGIN_DESK_KEY,
} from '.';
import { Button } from '@/components/ui/button';

/**
 * Plugin List Item Component
 *
 * Individual list item that automatically checks in to the desk
 * and watches prop changes for synchronization.
 */

const props = defineProps<{
  id: string;
}>();

// Automatically check in to the desk with data watching enabled
const { checkIn } = useCheckIn<PluginItemData, PluginItemContext>();
const { desk } = checkIn(PLUGIN_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: (desk) => {
    const item = desk.pluginItems?.value.find((i) => i.id === props.id);

    return {
      id: props.id,
      name: item?.name || '',
      description: item?.description || '',
      isActive: (desk as DeskWithPlugins).activeId?.value === props.id,
    };
  },
});

const deskWithPlugins = desk as typeof desk & DeskWithPlugins;

const data = computed(() => {
  return deskWithPlugins?.pluginItems.value.find((item) => item.id === props.id);
});

const isActive = computed(() => {
  return deskWithPlugins?.activeId?.value === props.id;
});

const setActive = () => {
  deskWithPlugins.setActive?.(props.id);
};

const remove = () => {
  deskWithPlugins.checkOut?.(props.id);
};
</script>

<template>
  <li
    :data-slot="`plugin-list-item-${props.id}`"
    class="flex items-center justify-between p-3 border border-muted rounded-md cursor-pointer transition-all duration-200 hover:bg-accent dark:hover:bg-accent-dark"
    :class="{
      'bg-primary-50 dark:bg-primary-900/20 border-primary-500': isActive,
    }"
    @click="setActive"
  >
    <div class="flex flex-col gap-1">
      <strong>{{ data?.name }}</strong>
      <span class="text-xs text-gray-600 dark:text-gray-400">ID: {{ data?.id }}</span>
    </div>
    <Button
      size="icon"
      aria-label="Remove item"
      class="bg-transparent hover:bg-transparent border-0 text-destructive/80 hover:text-destructive"
      @click.stop="remove"
    >
      <UIcon name="i-heroicons-trash" class="w-4 h-4" />
    </Button>
  </li>
</template>
