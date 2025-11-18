<script setup lang="ts">
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { type TodoItem, TODO_DESK_KEY } from '.';

const props = defineProps<{
  id: string | number;
  label: string;
  done: boolean;
}>();

const emit = defineEmits<{
  toggle: [id: string | number];
  remove: [id: string | number];
}>();

/**
 * Auto check-in with data watching enabled
 * The component will:
 * 1. Check in automatically when mounted
 * 2. Watch props changes and update the desk
 * 3. Check out automatically when unmounted
 */
const { checkIn } = useCheckIn<TodoItem>();
checkIn(TODO_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: () => ({
    label: props.label,
    done: props.done,
  }),
});
</script>

<template>
  <li class="item">
    <UCheckbox :model-value="props.done" @update:model-value="emit('toggle', props.id)" />
    <span :class="{ done: props.done }">
      {{ props.label }}
    </span>
    <UButton
      size="xs"
      color="error"
      variant="ghost"
      icon="i-heroicons-x-mark"
      @click="emit('remove', props.id)"
    />
  </li>
</template>

<style scoped>
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
