<script setup lang="ts">
import { useCheckIn } from '#vue-checkin/composables/useCheckIn';
import { PLUGIN_DESK_KEY } from './index';

/**
 * Plugin List Item Component
 * 
 * Individual list item that automatically checks in to the desk
 * and watches prop changes for synchronization.
 */

interface ListItem {
  name: string;
  description: string;
}

const props = defineProps<{
  id: string | number;
  name: string;
  description: string;
  isActive: boolean;
}>();

const emit = defineEmits<{
  select: [id: string | number];
  remove: [id: string | number];
}>();

// Automatically check in to the desk with data watching enabled
useCheckIn<ListItem>().checkIn(PLUGIN_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: () => ({
    name: props.name,
    description: props.description,
  }),
});
</script>

<template>
  <li
    class="item"
    :class="{ active: props.isActive }"
    @click="emit('select', props.id)"
  >
    <div class="item-content">
      <strong>{{ props.name }}</strong>
      <span class="item-id">ID: {{ props.id }}</span>
    </div>
    <UButton
      size="xs"
      color="error"
      variant="ghost"
      icon="i-heroicons-trash"
      @click.stop="emit('remove', props.id)"
    />
  </li>
</template>

<style scoped>
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid var(--ui-border-primary);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.item:hover {
  background: var(--ui-bg-secondary);
}

.item.active {
  background: var(--ui-primary-50);
  border-color: var(--ui-primary);
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-id {
  font-size: 0.75rem;
  color: var(--ui-text-secondary);
}
</style>
