<script setup lang="ts">
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { type TabItemData, TABS_DESK_KEY, TabItem } from '.';

/**
 * Tabs Example - Dynamic Tab Management
 *
 * Demonstrates:
 * - Creating a desk with shared context
 * - Dynamic tab creation and deletion
 * - Auto check-in of child components
 * - Context sharing between components
 */

// Reactive reference to store the active tab ID
const activeTabId = ref<string | number>('tab-1');

// Create a desk with context to share the active tab state
const { createDesk } = useCheckIn<TabItemData, { activeTab: Ref<string | number> }>();
createDesk(TABS_DESK_KEY, {
  devTools: true,
  debug: false,
  context: { activeTab: activeTabId },
});

// State to manage all tabs
const tabsData = ref<
  Array<{
    id: string;
    label: string;
    content: string;
    icon?: string;
  }>
>([
  {
    id: 'tab-1',
    label: 'Home',
    content: 'Welcome to the tabs demo!',
    icon: 'i-heroicons-home',
  },
  {
    id: 'tab-2',
    label: 'Settings',
    content: 'Application configuration',
    icon: 'i-heroicons-cog-6-tooth',
  },
  {
    id: 'tab-3',
    label: 'Profile',
    content: 'User information',
    icon: 'i-heroicons-user',
  },
]);

// Function to change the active tab
const selectTab = (id: string | number) => {
  activeTabId.value = id;
};

// Function to dynamically add a new tab
const addTab = () => {
  const id = `tab-${Date.now()}`;
  tabsData.value.push({
    id,
    label: `Tab ${tabsData.value.length + 1}`,
    content: `Content of tab ${tabsData.value.length + 1}`,
    icon: 'i-heroicons-document-text',
  });
  selectTab(id);
};

// Function to close a tab
const closeTab = (id: string | number) => {
  // Keep at least one tab open
  if (tabsData.value.length <= 1) return;

  const index = tabsData.value.findIndex((t) => t.id === id);
  if (index !== -1) {
    tabsData.value.splice(index, 1);
  }

  // If the active tab is closed, select the first available tab
  if (activeTabId.value === id && tabsData.value.length > 0) {
    const firstTab = tabsData.value[0];
    if (firstTab) {
      activeTabId.value = firstTab.id;
    }
  }
};

// Computed property for the active tab's content
const activeTabContent = computed(() => {
  const tab = tabsData.value.find((t) => t.id === activeTabId.value);
  return tab?.content || '';
});
</script>

<template>
  <div>
    <div class="flex gap-4 items-center mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
      <div class="flex gap-1 flex-1 overflow-x-auto">
        <TabItem
          v-for="tab in tabsData"
          :id="tab.id"
          :key="tab.id"
          :label="tab.label"
          :content="tab.content"
          :icon="tab.icon"
          :is-active="tab.id === activeTabId"
          :can-close="tabsData.length > 1"
          @select="selectTab"
          @close="closeTab"
        />
      </div>
      <UButton size="sm" icon="i-heroicons-plus" @click="addTab"> New Tab </UButton>
    </div>

    <div
      class="relative overflow-hidden p-6 min-h-[150px] bg-white dark:bg-gray-800 rounded-md mb-4"
    >
      <Transition name="slide-fade" mode="out-in">
        <p :key="activeTabId">{{ activeTabContent }}</p>
      </Transition>
    </div>

    <div
      class="p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-sm text-gray-600 dark:text-gray-400"
    >
      <strong>Debug:</strong> {{ tabsData.length }} tab(s), Active: {{ activeTabId }}
    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>
