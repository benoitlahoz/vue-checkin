<script setup lang="ts">
import { checkInToDesk } from '#vue-checkin/composables/desk-child';
import { type SearchResult, SEARCH_DESK_KEY } from '.';

interface Props extends SearchResult {
  id: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  remove: [id: string];
}>();

// Auto check-in to the search desk
const { checkOut, updateSelf } = checkInToDesk(SEARCH_DESK_KEY, {
  id: props.id,
  data: {
    title: props.title,
    description: props.description,
    category: props.category,
  },
});

// Update when props change
watch(() => [props.title, props.description, props.category], () => {
  updateSelf({
    title: props.title,
    description: props.description,
    category: props.category,
  });
});

// Check out on unmount
onUnmounted(() => {
  checkOut();
});

const handleRemove = () => {
  emit('remove', props.id);
};

// Get category color
const getCategoryColor = (category: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral' => {
  const colors: Record<string, 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'> = {
    'Vue': 'primary',
    'TypeScript': 'info',
    'JavaScript': 'warning',
    'CSS': 'secondary',
    'Node.js': 'success',
  };
  return colors[category] || 'neutral';
};
</script>

<template>
  <div class="result-item">
    <div class="result-header">
      <UBadge :color="getCategoryColor(category)" size="xs">
        {{ category }}
      </UBadge>
      <UButton
        icon="i-heroicons-x-mark"
        size="xs"
        color="neutral"
        variant="ghost"
        @click="handleRemove"
      />
    </div>
    
    <h4 class="result-title">{{ title }}</h4>
    <p class="result-description">{{ description }}</p>
  </div>
</template>

<style scoped>
.result-item {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.result-item:hover {
  border-color: var(--ui-border-active);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.result-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--ui-text-highlighted);
}

.result-description {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  line-height: 1.5;
}
</style>
