<script setup lang="ts">
import { useCheckIn } from '#vue-checkin/composables/useCheckIn';
import { AUTO_DESK_KEY } from './index';

/**
 * Demo Child Component
 * 
 * Automatically registers to the parent desk on mount and
 * keeps its data synchronized through watchData.
 */

interface ChildData {
  name: string;
  status: 'active' | 'inactive' | 'pending';
  count: number;
}

const props = defineProps<{
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  count: number;
}>();

const emit = defineEmits<{
  increment: [];
  'toggle-status': [];
  remove: [];
}>();

// Automatically check in to the parent desk with data watching enabled
// This ensures the component is registered when mounted and unregistered when unmounted
useCheckIn<ChildData>().checkIn(AUTO_DESK_KEY, {
  id: props.id,
  autoCheckIn: true,
  watchData: true,
  data: () => ({
    name: props.name,
    status: props.status,
    count: props.count,
  }),
});
</script>

<template>
  <div class="child-component" :class="`status-${props.status}`">
    <div class="child-header">
      <strong>{{ props.name }}</strong>
      <UButton
        size="xs"
        color="error"
        variant="ghost"
        icon="i-heroicons-x-mark"
        @click="emit('remove')"
      />
    </div>
    <div class="child-content">
      <div class="child-status">
        <UBadge
          :color="props.status === 'active' ? 'success' : props.status === 'inactive' ? 'neutral' : 'warning'"
          size="sm"
        >
          {{ props.status }}
        </UBadge>
        <UButton
          size="xs"
          variant="soft"
          @click="emit('toggle-status')"
        >
          Toggle
        </UButton>
      </div>
      <div class="child-counter">
        <span>Count: {{ props.count }}</span>
        <UButton
          size="xs"
          icon="i-heroicons-plus"
          @click="emit('increment')"
        >
          +1
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.child-component {
  padding: 1rem;
  border: 2px solid var(--ui-border-primary);
  border-radius: 0.375rem;
  background: var(--ui-bg-elevated);
  transition: all 0.2s;
}

.child-component.status-active {
  border-color: var(--ui-success);
}

.child-component.status-inactive {
  border-color: var(--ui-border-primary);
  opacity: 0.7;
}

.child-component.status-pending {
  border-color: var(--ui-warning);
}

.child-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--ui-border-primary);
}

.child-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.child-status,
.child-counter {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
