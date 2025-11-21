<script setup lang="ts">
import { useCheckIn } from '#vue-airport';
import { type SearchContext, type SearchResult, SEARCH_DESK_KEY } from '.';

const props = defineProps<{ id: string }>();

// Check in to the desk (autoCheckIn: false, comme ProductCard)
const { checkIn } = useCheckIn<SearchResult, SearchContext>();
const { desk } = checkIn(SEARCH_DESK_KEY, {
  id: props.id,
  autoCheckIn: false, // This is handled by desk patched by debounce plugin
  watchData: false, // No need to watch data changes here
  data: (desk) => {
    const field = desk.searchResults?.value?.find((r) => r.id === props.id);
    return {
      id: props.id,
      title: field?.title || '',
      description: field?.description || '',
      icon: field?.icon || '',
    };
  },
});

const data = computed(() => desk?.searchResults.value?.find((r) => r.id === props.id));

const onRemove = () => {
  desk?.checkOut(props.id);
};
</script>

<template>
  <div
    class="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-5 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md hover:-translate-y-0.5"
  >
    <div class="flex justify-between items-center mb-3">
      <UIcon :name="data!.icon" class="w-6 h-6" />
      <UButton
        icon="i-heroicons-x-mark"
        size="xs"
        color="neutral"
        variant="ghost"
        @click="onRemove"
      />
    </div>

    <h4 class="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{{ data?.title }}</h4>
    <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{{ data?.description }}</p>
  </div>
</template>

<style scoped></style>
