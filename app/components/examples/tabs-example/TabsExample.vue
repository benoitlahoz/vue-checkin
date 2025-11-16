<script setup lang="ts">
import { useCheckIn } from '@/vue-checkin/composables/useCheckIn';

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

// Computed pour les onglets
const tabs = computed(() => desk.getAll({ sortBy: 'timestamp', order: 'asc' }));

// Changer d'onglet
const selectTab = (id: string | number) => {
  activeTabId.value = id;
};

// Ajouter un onglet dynamiquement
const addTab = () => {
  const id = `tab-${Date.now()}`;
  desk.checkIn(id, {
    label: `Onglet ${tabs.value.length + 1}`,
    content: `Contenu de l'onglet ${tabs.value.length + 1}`,
    icon: 'i-heroicons-document-text',
  });
  selectTab(id);
};

// Fermer un onglet
const closeTab = (id: string | number) => {
  if (tabs.value.length <= 1) return; // Garder au moins un onglet

  desk.checkOut(id);

  // Si l'onglet actif est fermé, sélectionner le premier disponible
  if (activeTabId.value === id && tabs.value.length > 0) {
    const firstTab = tabs.value[0];
    if (firstTab) {
      activeTabId.value = firstTab.id;
    }
  }
};

// Contenu de l'onglet actif
const activeTabContent = computed(() => {
  const tab = desk.get(activeTabId.value);
  return tab?.data.content || '';
});

// Pré-remplir avec quelques onglets
onMounted(() => {
  desk.checkIn('tab-1', {
    label: 'Accueil',
    content: 'Bienvenue dans la démo des onglets !',
    icon: 'i-heroicons-home',
  });
  desk.checkIn('tab-2', {
    label: 'Paramètres',
    content: 'Configuration de l\'application',
    icon: 'i-heroicons-cog-6-tooth',
  });
  desk.checkIn('tab-3', {
    label: 'Profil',
    content: 'Informations utilisateur',
    icon: 'i-heroicons-user',
  });
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
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: tab.id === activeTabId }"
          @click="selectTab(tab.id)"
        >
          <UIcon v-if="tab.data.icon" :name="tab.data.icon" class="tab-icon" />
          <span>{{ tab.data.label }}</span>
          <UButton
            v-if="tabs.length > 1"
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click.stop="closeTab(tab.id)"
          />
        </button>
      </div>
      <UButton size="sm" icon="i-heroicons-plus" @click="addTab">
        Nouvel onglet
      </UButton>
    </div>

    <div class="tabs-content">
      <p>{{ activeTabContent }}</p>
    </div>

    <div class="debug-info">
      <strong>Debug:</strong> {{ tabs.length }} onglet(s),
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

.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem 0.375rem 0 0;
  cursor: pointer;
  color: var(--ui-text-secondary);
  transition: all 0.2s;
  white-space: nowrap;
}

.tab:hover {
  background: var(--ui-bg-secondary);
  color: var(--ui-text-primary);
}

.tab.active {
  background: var(--ui-bg-primary);
  color: var(--ui-text-primary);
  border-bottom: 2px solid var(--ui-primary);
}

.tab-icon {
  font-size: 1rem;
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
