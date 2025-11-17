<script setup lang="ts">
import { useCheckIn } from '#vue-checkin/composables/useCheckIn';
import TabItem from './TabItem.vue';
import { TABS_DESK_KEY } from './index';

/**
 * Tabs Example - Dynamic Tab Management
 * 
 * Demonstrates:
 * - Creating a desk with shared context
 * - Dynamic tab creation and deletion
 * - Auto check-in of child components
 * - Context sharing between components
 */

// Type definition for a tab item
interface TabItem {
  label: string;
  content: string;
  icon?: string;
}

// Reactive reference to store the active tab ID
const activeTabId = ref<string | number>('tab-1');

// Create a desk with context to share the active tab state
const { createDesk } = useCheckIn<TabItem, { activeTab: Ref<string | number> }>();
const { desk } = createDesk(TABS_DESK_KEY, {
  context: { activeTab: activeTabId },
  debug: false,
});

// State to manage all tabs
const tabsData = ref<Array<{
  id: string;
  label: string;
  content: string;
  icon?: string;
}>>([
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

// Computed property to get all registered tabs from the desk
const tabs = computed(() => desk.getAll({ sortBy: 'timestamp', order: 'asc' }));

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

  const index = tabsData.value.findIndex(t => t.id === id);
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
  const tab = tabsData.value.find(t => t.id === activeTabId.value);
  return tab?.content || '';
});
</script>

<template>
  <div class="demo-container">
    <h2>Tabs Example</h2>
    <p class="description">
      Example usage with a dynamic tab system and shared context.
    </p>

    <div class="tabs-header">
      <div class="tabs-list">
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
      <UButton size="sm" icon="i-heroicons-plus" @click="addTab">
        New Tab
      </UButton>
    </div>

    <div class="tabs-content">
      <p>{{ activeTabContent }}</p>
    </div>

    <div class="debug-info">
      <strong>Debug:</strong> {{ tabsData.length }} tab(s),
      Active: {{ activeTabId }}
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  padding: 1.5rem;
  border: 1px solid var(--ui-border-primary);
  border-radius: 0.5rem;
  background: var(--ui-bg-elevated);
}

.description {
  color: var(--ui-text-secondary);
  margin-bottom: 1.5rem;
}

.tabs-header {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--ui-border-primary);
  padding-bottom: 0.5rem;
}

.tabs-list {
  display: flex;
  gap: 0.25rem;
  flex: 1;
  overflow-x: auto;
}

.tabs-content {
  padding: 1.5rem;
  min-height: 150px;
  background: var(--ui-bg-primary);
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.debug-info {
  padding: 0.75rem;
  background: var(--ui-bg-secondary);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--ui-text-secondary);
}
</style>
