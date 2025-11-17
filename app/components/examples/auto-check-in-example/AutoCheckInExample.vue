<script setup lang="ts">
import { useCheckIn } from '#vue-checkin/composables/useCheckIn';
import { AUTO_DESK_KEY } from './index';

/**
 * Auto Check-in Example - Dynamic Component Registration
 * 
 * Demonstrates:
 * - Automatic component registration with autoCheckIn
 * - Data synchronization with watchData
 * - Dynamic component creation and removal
 * - Real-time registry updates
 */

// Type definition for child component data
interface ChildData {
  name: string;
  status: 'active' | 'inactive' | 'pending';
  count: number;
}

// Create parent desk for child components
const { createDesk } = useCheckIn<ChildData>();
const { desk } = createDesk(AUTO_DESK_KEY, {
  debug: true,
});

// State to manage child components
const children = ref<Array<{
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  count: number;
}>>([
  { id: 'child-1', name: 'Component A', status: 'active', count: 0 },
  { id: 'child-2', name: 'Component B', status: 'inactive', count: 0 },
]);

// Computed property to get all registered items from the desk
const registeredItems = computed(() => desk.getAll());

// Function to add a new child component
const addChild = () => {
  const id = `child-${Date.now()}`;
  const newChild: {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'pending';
    count: number;
  } = {
    id,
    name: `Component ${String.fromCharCode(65 + children.value.length)}`,
    status: 'pending',
    count: 0,
  };
  children.value.push(newChild);
};

// Function to remove a child component
const removeChild = (id: string) => {
  const index = children.value.findIndex(c => c.id === id);
  if (index !== -1) {
    children.value.splice(index, 1);
  }
};

// Function to increment the counter
const incrementCount = (id: string) => {
  const child = children.value.find(c => c.id === id);
  if (child) {
    child.count++;
  }
};

// Function to toggle the status
const toggleStatus = (id: string) => {
  const child = children.value.find(c => c.id === id);
  if (child) {
    child.status = child.status === 'active' ? 'inactive' : 'active';
  }
};
</script>

<template>
  <div class="demo-container">
    <h2>Auto Check-in Example</h2>
    <p class="description">
      Child components automatically register and synchronize their data via watch.
    </p>

    <div class="controls">
      <UButton icon="i-heroicons-plus" @click="addChild">
        Add Component
      </UButton>
      <UBadge color="primary" variant="subtle">
        {{ registeredItems.length }} registered out of {{ children.length }}
      </UBadge>
    </div>

    <div class="grid">
      <!-- Child components -->
      <div class="children-panel">
        <h3>Child Components</h3>
        <div class="children-list">
          <DemoChild
            v-for="child in children"
            :id="child.id"
            :key="child.id"
            :name="child.name"
            :status="child.status"
            :count="child.count"
            @increment="incrementCount(child.id)"
            @toggle-status="toggleStatus(child.id)"
            @remove="removeChild(child.id)"
          />
        </div>
      </div>

      <!-- Desk registry -->
      <div class="registry-panel">
        <h3>Registry (Desk)</h3>
        <div v-if="registeredItems.length === 0" class="empty-state">
          No component registered
        </div>
        <ul v-else class="registry-list">
          <li v-for="item in registeredItems" :key="item.id" class="registry-item">
            <div class="registry-info">
              <strong>{{ item.data.name }}</strong>
              <div class="registry-details">
                <UBadge
                  :color="item.data.status === 'active' ? 'success' : item.data.status === 'inactive' ? 'neutral' : 'warning'"
                  size="xs"
                >
                  {{ item.data.status }}
                </UBadge>
                <span class="count">Count: {{ item.data.count }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
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

.controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.children-panel,
.registry-panel {
  padding: 1rem;
  background: var(--ui-bg-primary);
  border: 1px solid var(--ui-border-primary);
  border-radius: 0.375rem;
}

h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.children-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.child-component {
  padding: 1rem;
  border: 2px solid var(--ui-border-primary);
  border-radius: 0.375rem;
  background: var(--ui-bg-elevated);
  transition: all 0.2s;
}

.child-component.status-active {
  border-color: var(--ui-success);
}

.child-component.status-inactive {
  border-color: var(--ui-border-primary);
  opacity: 0.7;
}

.child-component.status-pending {
  border-color: var(--ui-warning);
}

.child-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--ui-border-primary);
}

.child-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.child-status,
.child-counter {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--ui-text-secondary);
  border: 2px dashed var(--ui-border-primary);
  border-radius: 0.375rem;
}

.registry-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.registry-item {
  padding: 0.75rem;
  background: var(--ui-bg-secondary);
  border-radius: 0.375rem;
}

.registry-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.registry-details {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.count {
  font-size: 0.875rem;
  color: var(--ui-text-secondary);
  font-family: monospace;
}
</style>
