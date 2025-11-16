<script setup lang="ts">
import { useCheckIn } from '#vue-checkin/composables/useCheckIn';
import TodoItem from './TodoItem.vue';
import { TODO_DESK_KEY } from './index';

// Type pour les items de la liste
interface TodoItem {
  label: string;
  done: boolean;
}

// Créer un desk pour gérer les items
const { createDesk } = useCheckIn<TodoItem>();
const { desk } = createDesk(TODO_DESK_KEY, {
  debug: true,
  onCheckIn: (id, data) => {
    console.log(`✅ Item ajouté: ${id}`, data);
  },
  onCheckOut: (id) => {
    console.log(`❌ Item retiré: ${id}`);
  },
});

// State pour gérer les todos
const todos = ref<Array<{
  id: number;
  label: string;
  done: boolean;
}>>([]);

// Computed pour le nombre d'items
const itemCount = computed(() => desk.registry.value.size);

// Ajouter un item manuellement
const addItem = () => {
  const id = Date.now();
  todos.value.push({
    id,
    label: `Tâche ${id}`,
    done: false,
  });
};

// Basculer l'état done d'un item
const toggleItem = (id: string | number) => {
  const todo = todos.value.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
  }
};

// Retirer un item
const removeItem = (id: string | number) => {
  const index = todos.value.findIndex(t => t.id === id);
  if (index !== -1) {
    todos.value.splice(index, 1);
  }
};

// Tout effacer
const clearAll = () => {
  todos.value = [];
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

    <div v-if="todos.length === 0" class="empty-state">
      <p>Aucune tâche. Cliquez sur "Ajouter une tâche" pour commencer.</p>
    </div>

    <ul v-else class="item-list">
      <TodoItem
        v-for="todo in todos"
        :id="todo.id"
        :key="todo.id"
        :label="todo.label"
        :done="todo.done"
        @toggle="toggleItem"
        @remove="removeItem"
      />
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
</style>
