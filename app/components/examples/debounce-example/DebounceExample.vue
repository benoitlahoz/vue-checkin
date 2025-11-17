<script setup lang="ts">
import { useCheckIn } from '#vue-checkin/composables/useCheckIn';
import { createDebouncePlugin } from '#vue-checkin/plugins';
import SearchResultItem from './SearchResultItem.vue';
import { SEARCH_DESK_KEY } from '.';

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

// Type definition for search results
interface SearchResult {
  title: string;
  description: string;
  category: string;
}

// Create debounce plugin with 500ms delay
const debouncePlugin = createDebouncePlugin<SearchResult>({
  checkInDelay: 500,
  checkOutDelay: 300,
  maxWait: 2000, // Force execution after 2s max
});

// Create a desk with debounce plugin (NO logger to clearly see debouncing)
const { createDesk } = useCheckIn<SearchResult>();
const { desk } = createDesk(SEARCH_DESK_KEY, {
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
const searchResults = ref<Array<{
  id: string;
  title: string;
  description: string;
  category: string;
}>>([]);
const isSearching = ref(false);
const lastDebouncedEventTime = ref<string>('Never');
const eventLog = ref<Array<{ time: string; message: string }>>([]);
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Mock search database
const mockDatabase = [
  { id: 'vue-1', title: 'Vue 3 Composition API', description: 'Learn about the new Composition API', category: 'Vue' },
  { id: 'vue-2', title: 'Vue Router', description: 'Official routing library', category: 'Vue' },
  { id: 'vue-3', title: 'VueCheckIn Library', description: 'Generic check-in system for Vue', category: 'Vue' },
  { id: 'ts-1', title: 'TypeScript Basics', description: 'Introduction to TypeScript', category: 'TypeScript' },
  { id: 'ts-2', title: 'TypeScript Advanced', description: 'Advanced TypeScript patterns', category: 'TypeScript' },
  { id: 'js-1', title: 'JavaScript ES6+', description: 'Modern JavaScript features', category: 'JavaScript' },
  { id: 'js-2', title: 'Async/Await', description: 'Asynchronous programming', category: 'JavaScript' },
  { id: 'css-1', title: 'CSS Grid Layout', description: 'Master CSS Grid', category: 'CSS' },
  { id: 'css-2', title: 'Flexbox Guide', description: 'Complete flexbox guide', category: 'CSS' },
  { id: 'node-1', title: 'Node.js Fundamentals', description: 'Server-side JavaScript', category: 'Node.js' },
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
  await new Promise(resolve => setTimeout(resolve, 100));

  const results = mockDatabase.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  searchResults.value = results.map(r => ({ ...r }));
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
  const index = searchResults.value.findIndex(r => r.id === id);
  if (index !== -1) {
    searchResults.value.splice(index, 1);
  }
};
</script>

<template>
  <div class="demo-container">
    <h2>Debounce Plugin Example - Search</h2>
    <p class="description">
      Search-as-you-type with debounced event notifications. Events are batched and fired after 500ms of inactivity (max 2s wait).
    </p>

    <!-- Search Controls -->
    <div class="search-section">
      <UInput
        v-model="searchQuery"
        icon="i-heroicons-magnifying-glass"
        size="lg"
        placeholder="Vue, CSS, Typescript, ..."
        class="search-input"
      />
      
      <div class="controls">
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
        <UButton
          icon="i-heroicons-trash"
          color="error"
          @click="clearSearch"
        >
          Clear All
        </UButton>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Results Found</div>
        <div class="stat-value">{{ searchResults.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Checked In</div>
        <div class="stat-value">{{ itemCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending Events</div>
        <div class="stat-value" :class="{ 'text-primary': hasPending }">{{ pendingCheckIns }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Last Debounced Event</div>
        <div class="stat-value small">{{ lastDebouncedEventTime }}</div>
      </div>
    </div>

    <!-- Search Results -->
    <div class="results-section">
      <div v-if="isSearching" class="loading">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin" />
        Searching...
      </div>

      <div v-else-if="searchResults.length === 0 && searchQuery" class="empty-state">
        <UIcon name="i-heroicons-magnifying-glass" />
        <p>No results found for "{{ searchQuery }}"</p>
      </div>

      <div v-else-if="searchResults.length === 0" class="empty-state">
        <UIcon name="i-heroicons-document-magnifying-glass" />
        <p>Type to search...</p>
      </div>

      <TransitionGroup v-else name="list" tag="div" class="results-grid">
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
    <div class="event-log">
      <h3>Event Log</h3>
      <div class="log-entries">
        <TransitionGroup name="log" tag="div">
          <div
            v-for="(entry, index) in eventLog"
            :key="`${entry.time}-${index}`"
            class="log-entry"
          >
            <span class="log-time">{{ entry.time }}</span>
            <span class="log-message">{{ entry.message }}</span>
          </div>
        </TransitionGroup>
        <div v-if="eventLog.length === 0" class="log-empty">
          No events yet
        </div>
      </div>
    </div>

    <!-- Info Box -->
    <div class="info-box">
      <h3>How it works:</h3>
      <ul>
        <li>Search results check-in as you type</li>
        <li>Debounce plugin batches events (500ms delay)</li>
        <li>Events are forced after 2s (maxWait)</li>
        <li>You can manually flush or cancel pending events</li>
        <li>Check the event log to see debounced events firing</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--ui-text-highlighted);
}

.description {
  color: var(--ui-text-muted);
  margin-bottom: 2rem;
}

/* Search Section */
.search-section {
  margin-bottom: 2rem;
}

.search-input {
  margin-bottom: 1rem;
}

.controls {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Stats */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  padding: 1.25rem;
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ui-text-highlighted);
}

.stat-value.small {
  font-size: 1rem;
}

.stat-value.text-primary {
  color: var(--ui-primary);
}

/* Results Section */
.results-section {
  margin-bottom: 2rem;
  min-height: 300px;
}

.loading,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--ui-text-muted);
}

.loading svg {
  font-size: 2rem;
}

.empty-state svg {
  font-size: 3rem;
  opacity: 0.5;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

/* Event Log */
.event-log {
  margin-bottom: 2rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.event-log h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.log-entries {
  max-height: 300px;
  overflow-y: auto;
}

.log-entry {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--ui-border);
  font-size: 0.875rem;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: var(--ui-text-muted);
  font-family: monospace;
  flex-shrink: 0;
}

.log-message {
  color: var(--ui-text);
}

.log-empty {
  text-align: center;
  padding: 2rem;
  color: var(--ui-text-muted);
  font-style: italic;
}

/* Info Box */
.info-box {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.info-box h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.info-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-box li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.info-box li::before {
  content: "→";
  position: absolute;
  left: 0;
  color: var(--ui-primary);
}

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
