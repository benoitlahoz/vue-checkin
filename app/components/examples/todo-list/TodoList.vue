<script setup lang="ts">
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import TodoItem from './TodoItem.vue';
import { type TodoItemContext, type TodoItemData as TodoItemData, TODO_DESK_KEY } from '.';

/**
 * Local state for managing todos
 * Each todo will automatically check in to the desk when mounted
 */
const itemsData = ref<Array<TodoItemData & { id: string | number }>>([
  {
    id: 1,
    label: 'Learn Vue Airport',
    done: false,
  },
  {
    id: 2,
    label: 'Build awesome apps',
    done: false,
  },
]);

/**
 * Toggle the done state of a todo item
 */
const toggleDone = (id: string | number) => {
  const todo = itemsData.value.find((t) => t.id === id);
  if (todo) {
    todo.done = !todo.done;
  }
};

/**
 * Remove a todo item from the list
 * Will trigger auto check-out when component unmounts
 */
const removeItem = (id: string | number) => {
  const index = itemsData.value.findIndex((t) => t.id === id);
  if (index !== -1) {
    itemsData.value.splice(index, 1);
  }
};

/**
 * Create a desk to manage todo items
 * The desk acts as a central registry where child TodoItem components check in
 */
const { createDesk } = useCheckIn<TodoItemData, TodoItemContext>();
const { desk } = createDesk(TODO_DESK_KEY, {
  devTools: true,
  debug: false,
  onCheckIn: (id, data) => {
    console.log(`Item added: ${id}`, data);
  },
  onCheckOut: (id) => {
    console.log(`Item removed: ${id}`);
  },
  context: {
    toggleDone,
    removeItem,
    itemsData,
  },
});

/**
 * Add a new todo item
 * The TodoItem component will auto check-in when mounted
 */
const addItem = () => {
  const id = Date.now();
  itemsData.value.push({
    id,
    label: `Task ${id}`,
    done: false,
  });
};

/**
 * Clear all todos and reset the desk
 */
const clearAll = () => {
  itemsData.value = [];
  desk.clear();
};
</script>

<template>
  <div>
    <div class="flex gap-3 items-center mb-6 flex-wrap">
      <div class="flex-1 flex gap-3">
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
      </div>
      <UBadge color="primary" variant="subtle"> {{ desk.size.value }} item(s) </UBadge>
    </div>

    <div
      v-if="itemsData.length === 0"
      class="p-8 flex flex-col items-center justify-center min-h-[150px] bg-gray-300 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg"
    >
      <p>No tasks.</p>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
        Click "Add Task" to create your first item.
      </p>
    </div>

    <ul
      v-else
      class="list-none min-h-[150px] bg-gray-300 dark:bg-gray-700 p-2 m-0 rounded-lg flex flex-col gap-2"
    >
      <TodoItem v-for="todo in itemsData" :id="todo.id" :key="todo.id" />
    </ul>
  </div>
</template>
