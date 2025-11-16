<script setup lang="ts">
import { useCheckIn } from '@/vue-checkin/composables/useCheckIn';
import TabItem from './TabItem.vue';

// Type pour un onglet
interface TabItem {
  label: string;
  content: string;
  icon?: string;
}

// Context pour stocker l'onglet actif
const activeTabId = ref<string | number>('tab-1');

// Créer un desk avec contexte
const { createDesk } = useCheckIn<TabItem, { activeTab: Ref<string | number> }>();
const { desk } = createDesk('tabsDesk', {
  context: { activeTab: activeTabId },
  debug: false,
});

// State pour gérer les onglets
const tabsData = ref<Array<{
  id: string;
  label: string;
  content: string;
  icon?: string;
}>>([
  {
    id: 'tab-1',
    label: 'Accueil',
    content: 'Bienvenue dans la démo des onglets !',
    icon: 'i-heroicons-home',
  },
  {
    id: 'tab-2',
    label: 'Paramètres',
    content: 'Configuration de l\'application',
    icon: 'i-heroicons-cog-6-tooth',
  },
  {
    id: 'tab-3',
    label: 'Profil',
    content: 'Informations utilisateur',
    icon: 'i-heroicons-user',
  },
]);

// Computed pour les onglets
const tabs = computed(() => desk.getAll({ sortBy: 'timestamp', order: 'asc' }));

// Changer d'onglet
const selectTab = (id: string | number) => {
  activeTabId.value = id;
};

// Ajouter un onglet dynamiquement
const addTab = () => {
  const id = `tab-${Date.now()}`;
  tabsData.value.push({
    id,
    label: `Onglet ${tabsData.value.length + 1}`,
    content: `Contenu de l'onglet ${tabsData.value.length + 1}`,
    icon: 'i-heroicons-document-text',
  });
  selectTab(id);
};

// Fermer un onglet
const closeTab = (id: string | number) => {
  if (tabsData.value.length <= 1) return; // Garder au moins un onglet

  const index = tabsData.value.findIndex(t => t.id === id);
  if (index !== -1) {
    tabsData.value.splice(index, 1);
  }

  // Si l'onglet actif est fermé, sélectionner le premier disponible
  if (activeTabId.value === id && tabsData.value.length > 0) {
    const firstTab = tabsData.value[0];
    if (firstTab) {
      activeTabId.value = firstTab.id;
    }
  }
};

// Contenu de l'onglet actif
const activeTabContent = computed(() => {
  const tab = tabsData.value.find(t => t.id === activeTabId.value);
  return tab?.content || '';
});
</script>

<template>
  <div class="demo-container">
    <h2>Tabs Example</h2>
    <p class="description">
      Exemple d'utilisation avec un système d'onglets dynamiques et contexte partagé.
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
          :desk="desk"
          @select="selectTab"
          @close="closeTab"
        />
      </div>
      <UButton size="sm" icon="i-heroicons-plus" @click="addTab">
        Nouvel onglet
      </UButton>
    </div>

    <div class="tabs-content">
      <p>{{ activeTabContent }}</p>
    </div>

    <div class="debug-info">
      <strong>Debug:</strong> {{ tabsData.length }} onglet(s),
      Actif: {{ activeTabId }}
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
