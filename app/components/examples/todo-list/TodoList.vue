<script setup lang="ts">
import { useTemplateRef, nextTick } from 'vue';
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import TodoItem from './TodoItem.vue';
import { type TodoItemContext, type TodoItemData as TodoItemData, TODO_DESK_KEY } from '.';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Local state for managing todos
 * Each todo will automatically check in to the desk when mounted
 */
const itemsData = ref<Array<TodoItemData & { id: string | number }>>([
  {
    id: 1,
    label: 'Learn Vue Airport',
    done: true,
  },
  {
    id: 2,
    label: 'Create plugins',
    done: false,
  },
  {
    id: 3,
    label: 'Contribute',
    done: false,
  },
  {
    id: 4,
    label: 'Build awesome apps',
    done: false,
  },
]);

const listRef = useTemplateRef<HTMLUListElement>('listRef');

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
  nextTick(() => {
    listRef.value?.scrollTo({
      top: listRef.value.scrollHeight,
      behavior: 'smooth',
    });
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
        <Button @click="addItem">
          <UIcon name="i-heroicons-plus" class="w-4 h-4" /> Add Task
        </Button>
        <Button
          color="error"
          variant="destructive"
          :disabled="desk.size.value === 0"
          @click="clearAll"
        >
          <UIcon name="i-heroicons-trash" class="w-4 h-4" /> Clear All
        </Button>
      </div>
      <Badge variant="outline" class="bg-primary/10 text-primary">
        {{ desk.size.value }} item(s)
      </Badge>
    </div>

    <div
      v-if="itemsData.length === 0"
      class="flex flex-col items-center justify-center h-[150px] min-h-[150px] max-h-[150px] border-2 border-dashed rounded-lg"
    >
      <p>No tasks.</p>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
        Click "Add Task" to create your first item.
      </p>
    </div>

    <ul
      v-else
      ref="listRef"
      class="list-none min-h-[150px] max-h-[300px] p-0 m-0 flex flex-col gap-2 overflow-y-auto"
    >
      <TodoItem v-for="todo in itemsData" :id="todo.id" :key="todo.id" />
    </ul>
  </div>
</template>
