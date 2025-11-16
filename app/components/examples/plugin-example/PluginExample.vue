<script setup lang="ts">
import { useCheckIn, createActiveItemPlugin, createHistoryPlugin, type CheckInItem } from '#vue-checkin/composables/useCheckIn';
import PluginListItem from './PluginListItem.vue';
import { PLUGIN_DESK_KEY } from './index';

// Type pour les items
interface ListItem {
  name: string;
  description: string;
}

// Créer des plugins
const activeItemPlugin = createActiveItemPlugin<ListItem>();
const historyPlugin = createHistoryPlugin<ListItem>({ maxHistory: 10 });

// Créer un desk avec les plugins
const { createDesk } = useCheckIn<ListItem>();
const { desk } = createDesk(PLUGIN_DESK_KEY, {
  debug: true,
  plugins: [activeItemPlugin, historyPlugin],
});

// Typage étendu pour les méthodes des plugins
type DeskWithPlugins = typeof desk & {
  activeId?: Ref<string | number | null>;
  getActive?: () => CheckInItem<ListItem> | null;
  getHistory?: () => Array<{ type: string; id: string | number; timestamp: number }>;
  setActive?: (id: string | number | null) => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: Ref<boolean>;
  canRedo?: Ref<boolean>;
};

const deskWithPlugins = desk as DeskWithPlugins;

// State pour gérer les items
const itemsData = ref<Array<{
  id: string;
  name: string;
  description: string;
}>>([
  {
    id: 'item-1',
    name: 'Premier item',
    description: 'Ceci est le premier item de la liste',
  },
  {
    id: 'item-2',
    name: 'Deuxième item',
    description: 'Ceci est le deuxième item',
  },
  {
    id: 'item-3',
    name: 'Troisième item',
    description: 'Ceci est le troisième item',
  },
]);

// Computed pour les items et l'item actif
const activeId = computed(() => deskWithPlugins.activeId?.value);
const activeItem = computed(() => deskWithPlugins.getActive?.());
const history = computed(() => deskWithPlugins.getHistory?.() || []);

// Ajouter un item
const addItem = () => {
  const id = `item-${Date.now()}`;
  itemsData.value.push({
    id,
    name: `Item ${itemsData.value.length + 1}`,
    description: `Description de l'item ${itemsData.value.length + 1}`,
  });
  
  // Activer automatiquement le nouvel item
  deskWithPlugins.setActive?.(id);
};

// Sélectionner un item
const selectItem = (id: string | number) => {
  deskWithPlugins.setActive?.(id);
};

// Retirer un item
const removeItem = (id: string | number) => {
  const index = itemsData.value.findIndex(item => item.id === id);
  if (index !== -1) {
    itemsData.value.splice(index, 1);
  }
};

// Revenir en arrière dans l'historique
const undo = () => {
  deskWithPlugins.undo?.();
};

// Avancer dans l'historique
const redo = () => {
  deskWithPlugins.redo?.();
};

// Activer le premier item au montage
onMounted(() => {
  const firstItem = itemsData.value[0];
  if (firstItem) {
    deskWithPlugins.setActive?.(firstItem.id);
  }
});
</script>

<template>
  <div class="demo-container">
    <h2>Plugin Example</h2>
    <p class="description">
      Démonstration des plugins ActiveItem et History pour gérer la sélection et l'historique.
    </p>

    <div class="controls">
      <UButton icon="i-heroicons-plus" @click="addItem">
        Ajouter un item
      </UButton>
      <UButton
        icon="i-heroicons-arrow-uturn-left"
        variant="soft"
        :disabled="!deskWithPlugins.canUndo?.value"
        @click="undo"
      >
        Annuler
      </UButton>
      <UButton
        icon="i-heroicons-arrow-uturn-right"
        variant="soft"
        :disabled="!deskWithPlugins.canRedo?.value"
        @click="redo"
      >
        Rétablir
      </UButton>
    </div>

    <div class="content-grid">
      <!-- Liste des items -->
      <div class="items-panel">
        <h3>Items ({{ itemsData.length }})</h3>
        <ul class="item-list">
          <PluginListItem
            v-for="item in itemsData"
            :id="item.id"
            :key="item.id"
            :name="item.name"
            :description="item.description"
            :is-active="item.id === activeId"
            @select="selectItem"
            @remove="removeItem"
          />
        </ul>
      </div>

      <!-- Détails de l'item actif -->
      <div class="details-panel">
        <h3>Item actif</h3>
        <div v-if="activeItem" class="active-details">
          <p><strong>ID:</strong> {{ activeId }}</p>
          <p><strong>Nom:</strong> {{ activeItem.data.name }}</p>
          <p><strong>Description:</strong> {{ activeItem.data.description }}</p>
          <p class="timestamp">
            <strong>Timestamp:</strong>
            {{ new Date(activeItem.timestamp || 0).toLocaleString() }}
          </p>
        </div>
        <div v-else class="empty-state">
          Aucun item sélectionné
        </div>
      </div>

      <!-- Historique -->
      <div class="history-panel">
        <h3>Historique ({{ history.length }})</h3>
        <ul class="history-list">
          <li
            v-for="(entry, index) in history.slice().reverse()"
            :key="index"
            class="history-entry"
          >
            <UBadge
              :color="
                entry.type === 'check-in' ? 'success' :
                entry.type === 'check-out' ? 'error' :
                entry.type === 'update' ? 'info' : 'neutral'
              "
              size="xs"
            >
              {{ entry.type }}
            </UBadge>
            <span class="history-id">{{ entry.id }}</span>
            <span class="history-time">
              {{ new Date(entry.timestamp).toLocaleTimeString() }}
            </span>
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
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.items-panel,
.details-panel,
.history-panel {
  padding: 1rem;
  background: var(--ui-bg-primary);
  border: 1px solid var(--ui-border-primary);
  border-radius: 0.375rem;
}

.history-panel {
  grid-column: 1 / -1;
}

h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid var(--ui-border-primary);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.item:hover {
  background: var(--ui-bg-secondary);
}

.item.active {
  background: var(--ui-primary-50);
  border-color: var(--ui-primary);
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-id {
  font-size: 0.75rem;
  color: var(--ui-text-secondary);
}

.active-details p {
  margin: 0.5rem 0;
}

.timestamp {
  font-size: 0.875rem;
  color: var(--ui-text-secondary);
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--ui-text-secondary);
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.history-entry {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--ui-bg-secondary);
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.history-id {
  flex: 1;
  font-family: monospace;
}

.history-time {
  color: var(--ui-text-secondary);
  font-size: 0.75rem;
}
</style>
