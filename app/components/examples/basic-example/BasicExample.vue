<script setup lang="ts">
import { useCheckIn } from '@/vue-checkin/composables/useCheckIn';

// Type pour les items de la liste
interface TodoItem {
  label: string;
  done: boolean;
}

// Créer un desk pour gérer les items
const { createDesk } = useCheckIn<TodoItem>();
const { desk } = createDesk('todoDesk', {
  debug: true,
  onCheckIn: (id, data) => {
    console.log(`✅ Item ajouté: ${id}`, data);
  },
  onCheckOut: (id) => {
    console.log(`❌ Item retiré: ${id}`);
  },
});

// Computed pour afficher les items
const items = computed(() => desk.getAll());
const itemCount = computed(() => desk.registry.value.size);

// Ajouter un item manuellement
const addItem = () => {
  const id = Date.now();
  desk.checkIn(id, {
    label: `Tâche ${id}`,
    done: false,
  });
};

// Basculer l'état done d'un item
const toggleItem = (id: string | number) => {
  const item = desk.get(id);
  if (item) {
    desk.update(id, { done: !item.data.done });
  }
};

// Retirer un item
const removeItem = (id: string | number) => {
  desk.checkOut(id);
};

// Tout effacer
const clearAll = () => {
  desk.clear();
};
</script>

<template>
  <div class="demo-container">
    <h2>Basic Example - Todo List</h2>
    <p class="description">
      Démonstration du système check-in/check-out avec une simple liste de tâches.
    </p>

    <div class="controls">
      <UButton icon="i-heroicons-plus" @click="addItem">
        Ajouter une tâche
      </UButton>
      <UButton
        color="error"
        variant="soft"
        icon="i-heroicons-trash"
        :disabled="itemCount === 0"
        @click="clearAll"
      >
        Tout effacer
      </UButton>
      <UBadge color="primary" variant="subtle">
        {{ itemCount }} item(s)
      </UBadge>
    </div>

    <div v-if="items.length === 0" class="empty-state">
      <p>Aucune tâche. Cliquez sur "Ajouter une tâche" pour commencer.</p>
    </div>

    <ul v-else class="item-list">
      <li v-for="item in items" :key="item.id" class="item">
        <UCheckbox
          :model-value="item.data.done"
          @update:model-value="toggleItem(item.id)"
        />
        <span :class="{ done: item.data.done }">
          {{ item.data.label }}
        </span>
        <UButton
          size="xs"
          color="error"
          variant="ghost"
          icon="i-heroicons-x-mark"
          @click="removeItem(item.id)"
        />
      </li>
    </ul>
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

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--ui-text-secondary);
  border: 2px dashed var(--ui-border-primary);
  border-radius: 0.5rem;
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
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--ui-bg-primary);
  border: 1px solid var(--ui-border-primary);
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.item:hover {
  background: var(--ui-bg-secondary);
}

.item span {
  flex: 1;
  transition: all 0.2s;
}

.item span.done {
  text-decoration: line-through;
  opacity: 0.6;
}
</style>
