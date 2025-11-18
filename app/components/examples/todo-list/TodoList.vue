<script setup lang="ts">
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import TodoItem from './TodoItem.vue';
import { type TodoItem as TodoItemData, TODO_DESK_KEY } from '.';

/**
 * Create a desk to manage todo items
 * The desk acts as a central registry where child TodoItem components check in
 */
const { createDesk } = useCheckIn<TodoItemData>();
const { desk } = createDesk(TODO_DESK_KEY, {
  devTools: true,
  debug: false,
  onCheckIn: (id, data) => {
    console.log(`Item added: ${id}`, data);
  },
  onCheckOut: (id) => {
    console.log(`Item removed: ${id}`);
  },
});

/**
 * Local state for managing todos
 * Each todo will automatically check in to the desk when mounted
 */
const todos = ref<
  Array<{
    id: number;
    label: string;
    done: boolean;
  }>
>([]);

/**
 * Add a new todo item
 * The TodoItem component will auto check-in when mounted
 */
const addItem = () => {
  const id = Date.now();
  todos.value.push({
    id,
    label: `Task ${id}`,
    done: false,
  });
};

/**
 * Toggle the done state of a todo item
 */
const toggleItem = (id: string | number) => {
  const todo = todos.value.find((t) => t.id === id);
  if (todo) {
    todo.done = !todo.done;
  }
};

/**
 * Remove a todo item from the list
 * Will trigger auto check-out when component unmounts
 */
const removeItem = (id: string | number) => {
  const index = todos.value.findIndex((t) => t.id === id);
  if (index !== -1) {
    todos.value.splice(index, 1);
  }
};

/**
 * Clear all todos and reset the desk
 */
const clearAll = () => {
  todos.value = [];
  desk.clear();
};
</script>

<template>
  <div>
    <div class="controls">
      <UButton icon="i-heroicons-plus" @click="addItem"> Add Task </UButton>
      <UButton
        color="error"
        variant="soft"
        icon="i-heroicons-trash"
        :disabled="desk.size.value === 0"
        @click="clearAll"
      >
        Clear All
      </UButton>
      <UBadge color="primary" variant="subtle"> {{ desk.size.value }} item(s) </UBadge>
    </div>

    <div v-if="todos.length === 0" class="empty-state">
      <p>No tasks. Click "Add Task" to get started.</p>
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
