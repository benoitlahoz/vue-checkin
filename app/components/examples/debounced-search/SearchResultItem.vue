<script setup lang="ts">
import { checkInToDesk } from '#vue-airport/composables';
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
watch(
  () => [props.title, props.description, props.category],
  () => {
    updateSelf({
      title: props.title,
      description: props.description,
      category: props.category,
    });
  }
);

// Check out on unmount
onUnmounted(() => {
  checkOut();
});

const handleRemove = () => {
  emit('remove', props.id);
};

// Get category color
const getCategoryColor = (
  category: string
): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral' => {
  const colors: Record<
    string,
    'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  > = {
    Vue: 'primary',
    TypeScript: 'info',
    JavaScript: 'warning',
    CSS: 'secondary',
    'Node.js': 'success',
  };
  return colors[category] || 'neutral';
};
</script>

<template>
  <div
    class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md hover:-translate-y-0.5"
  >
    <div class="flex justify-between items-center mb-3">
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

    <h4 class="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{{ title }}</h4>
    <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{{ description }}</p>
  </div>
</template>

<style scoped></style>
