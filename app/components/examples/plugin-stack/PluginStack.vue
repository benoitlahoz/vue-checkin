<script setup lang="ts">
import { ref } from 'vue';
import { useCheckIn } from 'vue-airport';
import { createActiveItemPlugin, createHistoryPlugin } from '@vue-airport/plugins-base';
import {
  PluginStackListItem,
  PluginStackActiveItemPanel,
  PluginStackHistoryPanel,
  type DeskWithPlugins,
  type PluginItemContext,
  type PluginItemData,
  PLUGIN_DESK_KEY,
} from '.';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
/**
 * Plugin Example - Active Item and History
 *
 * Demonstrates:
 * - Using the ActiveItem plugin to manage selected items
 * - Using the History plugin to track operation history
 * - Real-time history of check-ins, check-outs, and updates
 * - Plugin type extensions
 */

// State to manage list items
const itemsData = ref<Array<PluginItemData>>([
  {
    id: 'item-1',
    name: 'First Item',
    description: 'This is the first item in the list',
  },
  {
    id: 'item-2',
    name: 'Second Item',
    description: 'This is the second item',
  },
  {
    id: 'item-3',
    name: 'Third Item',
    description: 'This is the third item',
  },
]);

const maxHistory = ref(30);

// Create plugins for active item tracking and history management
const activeItemPlugin = createActiveItemPlugin<PluginItemData>();
const historyPlugin = createHistoryPlugin<PluginItemData>({ maxHistory: maxHistory.value });

// Create a desk with plugins enabled
const { createDesk } = useCheckIn<PluginItemData, PluginItemContext>();
const { desk } = createDesk(PLUGIN_DESK_KEY, {
  devTools: true,
  debug: false,
  plugins: [activeItemPlugin, historyPlugin],
  context: {
    pluginItems: itemsData,
    maxHistory,
  },
  onCheckOut(id) {
    // Remove item from local state on check-out
    const index = itemsData.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      // Deactivate the item if it was active
      if (deskWithPlugins.activeId?.value === id) {
        deskWithPlugins.setActive?.(null);
      }
      itemsData.value.splice(index, 1);
    }

    // Set active to the nearest item if any
    if (itemsData.value.length > 0) {
      const newIndex = Math.min(index, itemsData.value.length - 1);
      const id = itemsData.value[newIndex]?.id;
      if (id) {
        deskWithPlugins.setActive?.(id);

        // Scroll to the new active item
        const el = document.querySelector(`[data-slot="plugin-list-item-${id}"]`);
        if (el) {
          (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  },
});

const deskWithPlugins = desk as DeskWithPlugins;

// Function to add a new item
const addItem = () => {
  const id = `item-${Date.now()}`;
  itemsData.value.push({
    id,
    name: `Item ${itemsData.value.length + 1}`,
    description: `Description of item ${itemsData.value.length + 1}`,
  });

  nextTick(() => {
    // Automatically activate the new item
    deskWithPlugins.setActive?.(id);

    // Scroll to the new item in the list
    const el = document.querySelector(`[data-slot="plugin-list-item-${id}"]`);
    if (el) {
      (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
};

// Activate the first item on component mount
onMounted(() => {
  const firstItem = itemsData.value[0];
  if (firstItem) {
    deskWithPlugins.setActive?.(firstItem.id);
  }
});
</script>

<template>
  <div>
    <div class="flex gap-3 mb-6 flex-wrap justify-between items-center">
      <Button @click="addItem">
        <UIcon name="i-heroicons-plus" class="mr-2 w-4 h-4" />
        Add Item
      </Button>
      <Badge variant="outline" class="border-primary bg-primary/20 text-primary px-3 py-1">
        {{ itemsData.length }} items
      </Badge>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Items list -->
      <div class="p-4 bg-card border border-muted rounded-md">
        <h3 class="m-0 mb-4 text-base font-semibold">Items ({{ itemsData.length }})</h3>
        <ul class="list-none p-0 m-0 flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          <PluginStackListItem v-for="item in itemsData" :id="item.id" :key="item.id" />
        </ul>
      </div>

      <!-- Active item details -->
      <PluginStackActiveItemPanel />

      <!-- History panel -->
      <PluginStackHistoryPanel />
    </div>
  </div>
</template>
