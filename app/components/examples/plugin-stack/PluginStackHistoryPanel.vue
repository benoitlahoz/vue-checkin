<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import {
  PLUGIN_DESK_KEY,
  type DeskWithPlugins,
  type PluginItemContext,
  type PluginItemData,
} from '.';

// Access the desk to retrieve history data
const { checkIn } = useCheckIn<PluginItemData, PluginItemContext>();
const { desk } = checkIn(PLUGIN_DESK_KEY);
const deskWithPlugins = desk as DeskWithPlugins;

const history = computed(() => deskWithPlugins?.getHistory?.() || []);
const maxHistory = computed(() => {
  return deskWithPlugins?.maxHistory?.value || 20;
});

// Helper to format action type for display
const formatAction = (action: string) => {
  const actionMap: Record<string, string> = {
    'check-in': 'Registered',
    'check-out': 'Unregistered',
    update: 'Updated',
  };
  return actionMap[action] || action;
};
</script>

<template>
  <div class="md:col-span-2 p-4 bg-card border border-muted rounded-md">
    <h3 class="m-0 mb-4 text-base font-semibold">
      Operation History ({{ history.length }} / {{ maxHistory }})
    </h3>
    <p class="mt-0 mb-4 text-sm text-muted">
      Tracks all check-ins, check-outs, and updates. Most recent operations appear first.
    </p>
    <ul class="list-none p-0 m-0 flex flex-col gap-2 max-h-[200px] overflow-y-auto">
      <li
        v-for="(entry, index) in history.slice().reverse()"
        :key="index"
        class="flex items-center gap-3 p-2 border-b border-border rounded text-sm"
      >
        <UIcon
          :name="
            entry.action === 'check-in'
              ? 'i-heroicons-plus-circle'
              : entry.action === 'check-out'
                ? 'i-heroicons-minus-circle'
                : 'i-heroicons-arrow-path'
          "
          :class="
            entry.action === 'check-in'
              ? 'text-green-500'
              : entry.action === 'check-out'
                ? 'text-red-500'
                : 'text-blue-500'
          "
        />
        <span class="font-medium min-w-[100px]">{{ formatAction(entry.action) }}</span>
        <span class="flex-1 font-mono">{{ entry.id }}</span>
        <span class="text-gray-600 dark:text-gray-400 text-xs">
          {{ new Date(entry.timestamp).toLocaleTimeString() }}
        </span>
      </li>
    </ul>
  </div>
</template>
