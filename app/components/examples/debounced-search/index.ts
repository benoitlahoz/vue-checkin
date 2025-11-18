import type { InjectionKey } from 'vue';
import type { DeskCore } from '#vue-airport/composables/useCheckIn';

export interface SearchResult {
  title: string;
  description: string;
  category: string;
}

export const SEARCH_DESK_KEY: InjectionKey<DeskCore<SearchResult>> = Symbol('searchDesk');

export { default as DebouncedSearch } from './DebouncedSearch.vue';
export { default as SearchResultItem } from './SearchResultItem.vue';
