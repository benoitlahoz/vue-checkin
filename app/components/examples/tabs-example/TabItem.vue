<script setup lang="ts">
import { useCheckIn, type CheckInDesk } from '@/vue-checkin/composables/useCheckIn';

interface TabItem {
  label: string;
  content: string;
  icon?: string;
}

const props = defineProps<{
  id: string | number;
  label: string;
  content: string;
  icon?: string;
  isActive: boolean;
  canClose: boolean;
  desk: CheckInDesk<TabItem>;
}>();

const emit = defineEmits<{
  select: [id: string | number];
  close: [id: string | number];
}>();

// Auto check-in avec watch des données
useCheckIn<TabItem>().checkIn(props.desk, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: () => ({
    label: props.label,
    content: props.content,
    icon: props.icon,
  }),
});
</script>

<template>
  <button
    class="tab"
    :class="{ active: props.isActive }"
    @click="emit('select', props.id)"
  >
    <UIcon v-if="props.icon" :name="props.icon" class="tab-icon" />
    <span>{{ props.label }}</span>
    <UButton
      v-if="props.canClose"
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-heroicons-x-mark"
      @click.stop="emit('close', props.id)"
    />
  </button>
</template>

<style scoped>
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
</style>
