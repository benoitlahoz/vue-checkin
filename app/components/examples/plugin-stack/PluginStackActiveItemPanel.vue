<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from 'vue-airport';
import {
  PLUGIN_DESK_KEY,
  type DeskWithPlugins,
  type PluginItemContext,
  type PluginItemData,
} from '.';

// Active Item Panel
// Displays details of the currently active item from the desk.
const { checkIn } = useCheckIn<PluginItemData, PluginItemContext>();
const { desk } = checkIn(PLUGIN_DESK_KEY);
const deskWithPlugins = desk as DeskWithPlugins;

const activeId = computed(() => deskWithPlugins.activeId?.value);
const activeItem = computed(() => deskWithPlugins.getActive?.());
</script>

<template>
  <div class="p-4 bg-card border border-muted rounded-md">
    <h3 class="m-0 mb-4 text-base font-semibold">Active Item</h3>
    <div v-if="activeItem" class="space-y-2">
      <p class="my-2"><strong>ID:</strong> {{ activeId }}</p>
      <p class="my-2"><strong>Name:</strong> {{ activeItem.data.name }}</p>
      <p class="my-2"><strong>Description:</strong> {{ activeItem.data.description }}</p>
      <p class="my-2 text-sm text-muted">
        <strong>Timestamp:</strong>
        {{ new Date(activeItem.timestamp!).toLocaleString() }}
      </p>
    </div>
    <div v-else class="py-8 text-center text-muted">No item selected</div>
  </div>
</template>
