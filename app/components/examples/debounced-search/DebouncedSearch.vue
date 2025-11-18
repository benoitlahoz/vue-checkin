<script setup lang="ts">
import { useCheckIn } from '#vue-airport/composables/useCheckIn';
import { createDebouncePlugin } from '#vue-airport/plugins';
import SearchResultItem from './SearchResultItem.vue';
import { type SearchResult, SEARCH_DESK_KEY } from '.';

/**
 * Debounce Plugin Example - Search Results
 *
 * Demonstrates:
 * - Debouncing check-in events
 * - Search-as-you-type functionality
 * - Event batching with maxWait
 * - Pending operations tracking
 * - Manual flush/cancel operations
 */

// Create debounce plugin with 500ms delay
const debouncePlugin = createDebouncePlugin<SearchResult>({
  checkInDelay: 500,
  checkOutDelay: 300,
  maxWait: 2000, // Force execution after 2s max
});

// Create a desk with debounce plugin (NO logger to clearly see debouncing)
const { createDesk } = useCheckIn<SearchResult>();
const { desk } = createDesk(SEARCH_DESK_KEY, {
  devTools: true,
  debug: false,
  plugins: [debouncePlugin],
});

// Extended type to include debounce methods
type DeskWithDebounce = typeof desk & {
  pendingCheckInsCount?: Ref<number>;
  pendingCheckOutsCount?: Ref<number>;
  hasPendingDebounce?: Ref<boolean>;
  flushDebounce?: () => void;
  cancelDebounce?: () => void;
  onDebouncedCheckIn?: (callback: (id: string | number, data: SearchResult) => void) => void;
};

const deskWithDebounce = desk as DeskWithDebounce;

// Search state
const searchQuery = ref('');
const debouncedSearchQuery = ref('');
const searchResults = ref<
  Array<{
    id: string;
    title: string;
    description: string;
    category: string;
  }>
>([]);
const isSearching = ref(false);
const lastDebouncedEventTime = ref<string>('Never');
const eventLog = ref<Array<{ time: string; message: string }>>([]);
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Mock search database
const mockDatabase = [
  {
    id: 'vue-1',
    title: 'Vue 3 Composition API',
    description: 'Learn about the new Composition API',
    category: 'Vue',
  },
  { id: 'vue-2', title: 'Vue Router', description: 'Official routing library', category: 'Vue' },
  {
    id: 'vue-3',
    title: 'VueCheckIn Library',
    description: 'Generic check-in system for Vue',
    category: 'Vue',
  },
  {
    id: 'ts-1',
    title: 'TypeScript Basics',
    description: 'Introduction to TypeScript',
    category: 'TypeScript',
  },
  {
    id: 'ts-2',
    title: 'TypeScript Advanced',
    description: 'Advanced TypeScript patterns',
    category: 'TypeScript',
  },
  {
    id: 'js-1',
    title: 'JavaScript ES6+',
    description: 'Modern JavaScript features',
    category: 'JavaScript',
  },
  {
    id: 'js-2',
    title: 'Async/Await',
    description: 'Asynchronous programming',
    category: 'JavaScript',
  },
  { id: 'css-1', title: 'CSS Grid Layout', description: 'Master CSS Grid', category: 'CSS' },
  { id: 'css-2', title: 'Flexbox Guide', description: 'Complete flexbox guide', category: 'CSS' },
  {
    id: 'node-1',
    title: 'Node.js Fundamentals',
    description: 'Server-side JavaScript',
    category: 'Node.js',
  },
];

// Listen to debounced check-in events
deskWithDebounce.onDebouncedCheckIn?.((id, data) => {
  const time = new Date().toLocaleTimeString();
  lastDebouncedEventTime.value = time;
  addEventLog(`Debounced check-in fired for: ${data.title}`);
});

// Add event to log
const addEventLog = (message: string) => {
  const time = new Date().toLocaleTimeString();
  eventLog.value.unshift({ time, message });
  if (eventLog.value.length > 10) {
    eventLog.value = eventLog.value.slice(0, 10);
  }
};

// Simulate search with debounced results
const performSearch = async (query: string) => {
  if (!query.trim()) {
    searchResults.value = [];
    desk.clear();
    addEventLog('Search cleared');
    return;
  }

  isSearching.value = true;
  addEventLog(`Search executing: "${query}"`);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const results = mockDatabase.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  searchResults.value = results.map((r) => ({ ...r }));
  isSearching.value = false;

  addEventLog(`Found ${results.length} results`);
};

// Debounce the search query with 500ms delay
watch(searchQuery, (newQuery) => {
  // Clear existing timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  // Show searching state immediately
  if (newQuery.trim()) {
    addEventLog(`Typing: "${newQuery}" (waiting for pause...)`);
  }

  // Set new timer to update debounced value
  searchDebounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = newQuery;
    addEventLog(`Search debounced! Executing search...`);
  }, 500);
});

// Watch debounced query and trigger actual search
watch(debouncedSearchQuery, (newQuery) => {
  performSearch(newQuery);
});

// Computed count of items
const itemCount = computed(() => desk.registryMap.size);

// Pending counts
const pendingCheckIns = computed(() => deskWithDebounce.pendingCheckInsCount?.value ?? 0);
const hasPending = computed(() => deskWithDebounce.hasPendingDebounce?.value ?? false);

// Manually flush debounced events
const flushNow = () => {
  deskWithDebounce.flushDebounce?.();
  addEventLog('Manually flushed debounced events');
};

// Cancel pending debounced events
const cancelPending = () => {
  deskWithDebounce.cancelDebounce?.();
  addEventLog('Cancelled pending debounced events');
};

// Clear search
const clearSearch = () => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  searchQuery.value = '';
  debouncedSearchQuery.value = '';
  searchResults.value = [];
  desk.clear();
  eventLog.value = [];
  addEventLog('Search cleared');
};

// Remove a result
const removeResult = (id: string) => {
  const index = searchResults.value.findIndex((r) => r.id === id);
  if (index !== -1) {
    searchResults.value.splice(index, 1);
  }
};
</script>

<template>
  <div>
    <!-- Search Controls -->
    <div class="mb-8">
      <UInput
        v-model="searchQuery"
        icon="i-heroicons-magnifying-glass"
        size="lg"
        placeholder="Vue, CSS, Typescript, ..."
        class="mb-4"
      />

      <div class="flex gap-3 flex-wrap">
        <UButton
          icon="i-heroicons-arrow-path"
          color="primary"
          :disabled="!hasPending"
          @click="flushNow"
        >
          Flush Now ({{ pendingCheckIns }})
        </UButton>
        <UButton
          icon="i-heroicons-x-mark"
          color="neutral"
          :disabled="!hasPending"
          @click="cancelPending"
        >
          Cancel Pending
        </UButton>
        <UButton icon="i-heroicons-trash" color="error" @click="clearSearch"> Clear All </UButton>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div
        class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 text-center"
      >
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Results Found
        </div>
        <div class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {{ searchResults.length }}
        </div>
      </div>
      <div
        class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 text-center"
      >
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Checked In
        </div>
        <div class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ itemCount }}</div>
      </div>
      <div
        class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 text-center"
      >
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Pending Events
        </div>
        <div
          class="text-3xl font-bold"
          :class="
            hasPending
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-900 dark:text-gray-100'
          "
        >
          {{ pendingCheckIns }}
        </div>
      </div>
      <div
        class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 text-center"
      >
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Last Debounced Event
        </div>
        <div class="text-base font-bold text-gray-900 dark:text-gray-100">
          {{ lastDebouncedEventTime }}
        </div>
      </div>
    </div>

    <!-- Search Results -->
    <div class="mb-8 min-h-[300px]">
      <div
        v-if="isSearching"
        class="flex flex-col items-center justify-center gap-4 py-12 text-gray-500 dark:text-gray-400"
      >
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl" />
        Searching...
      </div>

      <div
        v-else-if="searchResults.length === 0 && searchQuery"
        class="flex flex-col items-center justify-center gap-4 py-12 text-gray-500 dark:text-gray-400"
      >
        <UIcon name="i-heroicons-magnifying-glass" class="text-5xl opacity-50" />
        <p>No results found for "{{ searchQuery }}"</p>
      </div>

      <div
        v-else-if="searchResults.length === 0"
        class="flex flex-col items-center justify-center gap-4 py-12 text-gray-500 dark:text-gray-400"
      >
        <UIcon name="i-heroicons-document-magnifying-glass" class="text-5xl opacity-50" />
        <p>Type to search...</p>
      </div>

      <TransitionGroup
        v-else
        name="list"
        tag="div"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <SearchResultItem
          v-for="result in searchResults"
          :id="result.id"
          :key="result.id"
          :title="result.title"
          :description="result.description"
          :category="result.category"
          @remove="removeResult"
        />
      </TransitionGroup>
    </div>

    <!-- Event Log -->
    <div
      class="mb-8 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
    >
      <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Event Log</h3>
      <div class="max-h-[300px] overflow-y-auto">
        <TransitionGroup name="log" tag="div">
          <div
            v-for="(entry, index) in eventLog"
            :key="`${entry.time}-${index}`"
            class="flex gap-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm last:border-b-0"
          >
            <span class="text-gray-500 dark:text-gray-400 font-mono shrink-0">{{
              entry.time
            }}</span>
            <span class="text-gray-900 dark:text-gray-100">{{ entry.message }}</span>
          </div>
        </TransitionGroup>
        <div
          v-if="eventLog.length === 0"
          class="text-center py-8 text-gray-500 dark:text-gray-400 italic"
        >
          No events yet
        </div>
      </div>
    </div>

    <!-- Info Box -->
    <div
      class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
    >
      <h3 class="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">How it works:</h3>
      <ul class="space-y-2">
        <li
          class="pl-6 relative text-gray-700 dark:text-gray-300 before:content-['→'] before:absolute before:left-0 before:text-primary-600 dark:before:text-primary-400"
        >
          Search results check-in as you type
        </li>
        <li
          class="pl-6 relative text-gray-700 dark:text-gray-300 before:content-['→'] before:absolute before:left-0 before:text-primary-600 dark:before:text-primary-400"
        >
          Debounce plugin batches events (500ms delay)
        </li>
        <li
          class="pl-6 relative text-gray-700 dark:text-gray-300 before:content-['→'] before:absolute before:left-0 before:text-primary-600 dark:before:text-primary-400"
        >
          Events are forced after 2s (maxWait)
        </li>
        <li
          class="pl-6 relative text-gray-700 dark:text-gray-300 before:content-['→'] before:absolute before:left-0 before:text-primary-600 dark:before:text-primary-400"
        >
          You can manually flush or cancel pending events
        </li>
        <li
          class="pl-6 relative text-gray-700 dark:text-gray-300 before:content-['→'] before:absolute before:left-0 before:text-primary-600 dark:before:text-primary-400"
        >
          Check the event log to see debounced events firing
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.log-enter-active,
.log-leave-active {
  transition: all 0.2s ease;
}

.log-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.log-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
