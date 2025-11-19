<script setup lang="ts">
import { computed } from 'vue';
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { type TodoItemContext, type TodoItemData, TODO_DESK_KEY } from '.';

const props = defineProps<{
  id: string | number;
}>();

/**
 * Check in to the desk to access context methods
 */
const { checkIn } = useCheckIn<TodoItemData, TodoItemContext>();
const { desk } = checkIn(TODO_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  data: (desk) => {
    const item = desk.itemsData?.value.find((t) => t.id === props.id);
    if (!item) return { label: '', done: false };
    return item;
  },
});

// Get item data from itemsData
const itemData = computed(() => {
  return desk?.itemsData?.value.find((t) => t.id === props.id);
});

const onDone = () => {
  desk?.toggleDone(props.id);
};

const onDelete = () => {
  desk?.removeItem(props.id);
};
</script>

<template>
  <li
    class="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-500 rounded-md transition-all duration-200 bg-muted hover:bg-gray-50 dark:hover:bg-gray-800"
  >
    <UCheckbox :model-value="itemData?.done ?? false" @update:model-value="onDone" />
    <span
      class="flex-1 transition-all duration-200"
      :class="itemData?.done ? 'line-through opacity-60' : ''"
    >
      {{ itemData?.label }}
    </span>
    <UButton size="xs" color="error" variant="ghost" icon="i-heroicons-x-mark" @click="onDelete" />
  </li>
</template>
