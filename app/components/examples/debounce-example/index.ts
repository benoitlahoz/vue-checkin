import type { InjectionKey } from 'vue';
import type { DeskCore } from '#vue-checkin/composables/useCheckIn';

interface SearchResult {
  title: string;
  description: string;
  category: string;
}

export const SEARCH_DESK_KEY: InjectionKey<DeskCore<SearchResult>> = Symbol('searchDesk');

export { default as DebounceExample } from './DebounceExample.vue';
export { default as SearchResultItem } from './SearchResultItem.vue';
