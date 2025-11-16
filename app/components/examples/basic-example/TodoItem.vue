<script setup lang="ts">
import { useCheckIn, type CheckInDesk } from '@/vue-checkin/composables/useCheckIn';

interface TodoItem {
  label: string;
  done: boolean;
}

const props = defineProps<{
  id: string | number;
  label: string;
  done: boolean;
  desk: CheckInDesk<TodoItem>;
}>();

const emit = defineEmits<{
  toggle: [id: string | number];
  remove: [id: string | number];
}>();

// Auto check-in avec watch des données
useCheckIn<TodoItem>().checkIn(props.desk, {
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
    <UCheckbox
      :model-value="props.done"
      @update:model-value="emit('toggle', props.id)"
    />
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
